using LogicUI.FancyTextRendering;
using OllamaSharp;
using System;
using System.Linq;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

public class ChatBot : MonoBehaviour
{
    private OllamaApiClient _ollama;
    private Chat _chat;
    private object[] _tools;
    private bool _running;
    private string _history;
    private string _tokens;
    private string _thoughts;

    public Dropdown Models;
    public Dropdown Prompts;
    public InputField Input;
    public MarkdownRenderer Output;
    public ScrollRect OutputScroll;

    public void SelectModel(int choice)
    {
        _ollama.SelectedModel = Models.options[choice].text;
        _chat.Think = SupportThink(_ollama.SelectedModel);
    }

    public void SelectPrompt(int choice)
    {
        _chat.OnThink -= OnThink;
        if (choice == 0) {
            _chat = new(_ollama);
        } else {
            _chat = new(_ollama, Resources.Load<TextAsset>($"Prompts/{Prompts.options[choice].text}").text);
        }
        _chat.OnThink += OnThink;
        _chat.Think = SupportThink(_ollama.SelectedModel);
    }

    public async void SendInput()
    {
        if (_running) {
            return;
        }
        _running = true;
        string input = Input.text.Trim();
        Input.text = "";
        if (input.StartsWith("/")) {
            await HandleCommand(input);
        } else {
            await HandleChat(input);
        }
        _running = false;
    }

    private async Awaitable HandleCommand(string input)
    {
        if (input == "/clear") {
            SelectPrompt(Prompts.value);
            Output.Source = "";
            _history = Output.Source;
            _tokens = "";
            _thoughts = "";
        } else if (input.StartsWith("/py ")) {
            string code = input.Substring(4);
            string output = PyRunner.RunBlocking(code);
            Output.Source += $"\n<color=yellow>{input}\n{output}</color>\n";
            _history = Output.Source;
        }
    }

    private async Awaitable HandleChat(string input)
    {
        Output.Source += $"<color=grey>{input}</color>";
        _history = Output.Source;
        _tokens = "";
        _thoughts = "";
        await Awaitable.BackgroundThreadAsync();
        var stream = SupportTools(_ollama.SelectedModel) ? _chat.SendAsync(input, _tools) : _chat.SendAsync(input);
        await foreach (string token in stream) {
            await Awaitable.MainThreadAsync();
            AddOutput(token, "");
            await Awaitable.BackgroundThreadAsync();
        }
        await Awaitable.MainThreadAsync();
    }

    private async void OnThink(object sender, string thought)
    {
        await Awaitable.MainThreadAsync();
        AddOutput("", thought);
        await Awaitable.BackgroundThreadAsync();
    }

    private void AddOutput(string token, string thought)
    {
        _tokens += token;
        _thoughts += thought;
        Output.Source = $"{_history}\n\n<i>{_thoughts}</i>\n\n{_tokens}\n\n";
        OutputScroll.verticalNormalizedPosition = 0;
    }

    private bool SupportThink(string model)
    {
        return model.StartsWith("gpt-oss") || model.StartsWith("qwen") || model.StartsWith("deepseek");
    }

    private bool SupportTools(string model)
    {
        return model.StartsWith("gpt-oss") || model.StartsWith("qwen");
    }

    async void Start()
    {
        _ollama = new(new Uri("http://berkeley.babeltimeus.com:11434"));
        var models = await _ollama.ListLocalModelsAsync();
        Models.AddOptions(models.Select(model => model.Name).ToList());
        _ollama.SelectedModel = Models.options[0].text;
        var prompts = Resources.LoadAll<TextAsset>("Prompts").Select(prompt => prompt.name).ToList();
        prompts.Insert(0, "");
        Prompts.AddOptions(prompts);
        _chat = new(_ollama);
        _chat.OnThink += OnThink;
        _chat.Think = SupportThink(_ollama.SelectedModel);
        _tools = new object[] {
            new GeneratedTools.GetUtcNowTool(),
            new GeneratedTools.RunPythonTool()
        };
    }

    void Update()
    {
        var currentKeyboard = Keyboard.current;
        if (currentKeyboard != null &&
            currentKeyboard.enterKey.wasPressedThisFrame &&
            (currentKeyboard.leftCtrlKey.isPressed || currentKeyboard.rightCtrlKey.isPressed)) {
            SendInput();
        }
    }

    void OnDestroy()
    {
        _chat.OnThink -= OnThink;
        PyRunner.Shutdown();
    }
}

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
    public InputField Input;
    public MarkdownRenderer Output;
    public ScrollRect OutputScroll;

    public void SelectModel(int choice)
    {
        _ollama.SelectedModel = Models.options[choice].text;
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
            HandleCommand(input);
        } else {
            await HandleChat(input);
        }
        _running = false;
    }

    private void HandleCommand(string command)
    {
        if (command == "/clear") {
            _chat = new(_ollama);
            _chat.OnThink += OnThink;
            _chat.Think = SupportThink(_ollama.SelectedModel);
            Output.Source = "";
            _history = Output.Source;
            _tokens = "";
            _thoughts = "";
        }
    }

    private async Awaitable HandleChat(string input)
    {
        Output.Source += $"<color=black>{input}</color>";
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
        return model.StartsWith("gpt-oss") || model.StartsWith("deepseek");
    }

    private bool SupportTools(string model)
    {
        return model.StartsWith("gpt-oss") || model.StartsWith("qwen");
    }

    async void Start()
    {
        _ollama = new(new Uri("http://berkeley.babeltimeus.com:11434"));
        _chat = new(_ollama);
        _chat.OnThink += OnThink;
        _tools = new object[] {
            new GeneratedTools.GetUtcNowTool()
        };
        var models = await _ollama.ListLocalModelsAsync();
        Models.AddOptions(models.Select(model => model.Name).ToList());
        SelectModel(0);
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
}

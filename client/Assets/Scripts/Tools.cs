using OllamaSharp;
using System;

public static class Tools
{
    [OllamaTool]
    public static string GetUtcNow()
    {
        return DateTime.UtcNow.ToString("F");
    }

    [OllamaTool]
    public static string RunPython(string code)
    {
        return PyRunner.RunBlocking(code);
    }
}

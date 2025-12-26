using OllamaSharp;
using System;
using UnityEngine;

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
        Debug.Log(code);
        string output = PyRunner.RunBlocking(code);
        Debug.Log(output);
        return output;
    }
}

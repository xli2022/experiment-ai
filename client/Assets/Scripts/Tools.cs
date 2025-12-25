using OllamaSharp;
using System;

public static class Tools
{
    [OllamaTool]
    public static string GetUtcNow()
    {
        return DateTime.UtcNow.ToString("F");
    }
}

using OllamaSharp;
using System;
using System.IO;
using System.Linq;

public static class Tools
{
    [OllamaTool]
    public static string GetUtcNow()
    {
        return DateTime.UtcNow.ToString("F");
    }

    [OllamaTool]
    public static string FileExists(string path)
    {
        try {
            return File.Exists(GetPath(path)).ToString();
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string ReadFile(string path)
    {
        try {
            return File.ReadAllText(GetPath(path));
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string WriteFile(string path, string content)
    {
        try {
            File.WriteAllText(GetPath(path), content);
            return "OK";
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string DeleteFile(string path)
    {
        try {
            File.Delete(GetPath(path));
            return "OK";
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string DirectoryExists(string path)
    {
        try {
            return Directory.Exists(GetPath(path)).ToString();
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string CreateDirectory(string path)
    {
        try {
            Directory.CreateDirectory(GetPath(path));
            return "OK";
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string DeleteDirectory(string path)
    {
        try {
            Directory.Delete(GetPath(path));
            return "OK";
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string ListFiles(string path)
    {
        try {
            var files = Directory.GetFiles(GetPath(path)).Select(x => Path.GetFileName(x));
            return string.Join("\n", files);
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    [OllamaTool]
    public static string ListDirectories(string path)
    {
        try {
            var directories = Directory.GetDirectories(GetPath(path)).Select(x => Path.GetFileName(x));
            return string.Join("\n", directories);
        } catch (Exception ex) {
            return ex.ToString();
        }
    }

    private static string GetPath(string path)
    {
        return Path.Combine(@"C:\Users\sam\Projects\experiments\ai\Sandbox", path.Replace("..", ""));
    }

    [OllamaTool]
    public static string RunPython(string code)
    {
        return PyRunner.RunBlocking(code);
    }
}

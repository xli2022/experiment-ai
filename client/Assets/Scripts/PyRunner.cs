using Python.Runtime;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

public static class PyRunner
{
    private sealed class Request
    {
        public string Code = "";
        public TaskCompletionSource<string> Tcs = new(TaskCreationOptions.RunContinuationsAsynchronously);
    }

    private static int _started;
    private static readonly ConcurrentQueue<Request> _queue = new();
    private static readonly AutoResetEvent _wake = new(false);

    public static string RunBlocking(string code, int timeoutMs = 30000)
    {
        StartIfNeeded();
        Request req = new() { Code = code };
        _queue.Enqueue(req);
        _wake.Set();
        string output;
        if (req.Tcs.Task.Wait(timeoutMs)) {
            output = req.Tcs.Task.Result;
        } else {
            output = "Python execution timed out.";
        }
        return output;
    }

    public static void Shutdown()
    {
        if (Interlocked.CompareExchange(ref _started, 0, 1) == 1) {
            _wake.Set();
        }
    }

    private static void StartIfNeeded()
    {
        if (Interlocked.CompareExchange(ref _started, 1, 0) != 0) {
            return;
        }
        Thread thread = new(PythonThreadMain) {
            IsBackground = true,
            Name = "PythonThread"
        };
        thread.Start();
    }

    private static void PythonThreadMain()
    {
        // Pin the exact runtime you want here. Do this before Initialize.
        // Adjust paths to your environment.
        string pyHome = @"C:\Users\sam\AppData\Local\Programs\Python\Python313";
        Runtime.PythonDLL = Path.Combine(pyHome, "python313.dll");
        PythonEngine.PythonHome = pyHome;
        PythonEngine.PythonPath = string.Join(";", new[] {
            @"C:\Users\sam\Projects\experiments\ai\PythonLib",
            Path.Combine(pyHome, "Lib"),
            Path.Combine(pyHome, "Lib", "site-packages")
        });
        PythonEngine.Initialize();
        PythonEngine.BeginAllowThreads();

        PyDict globals;
        PyDict locals;
        dynamic contextlib;
        dynamic io;
        dynamic sys;
        using (Py.GIL()) {
            globals = new();
            locals = new();
            contextlib = Py.Import("contextlib");
            io = Py.Import("io");
            sys = Py.Import("sys");
        }

        while (true) {
            _wake.WaitOne();
            if (Interlocked.CompareExchange(ref _started, 0, 0) == 0) {
                break;
            }
            while (_queue.TryDequeue(out var req)) {
                try {
                    string output = "";
                    using (Py.GIL()) {
                        Py.With((PyObject)contextlib.redirect_stderr(sys.stdout), _ => {
                            Py.With((PyObject)contextlib.redirect_stdout(io.StringIO()), f => {
                                PythonEngine.Exec(req.Code, globals, locals);
                                output = f.getvalue();
                            });
                        });
                    }
                    req.Tcs.TrySetResult(output);
                } catch (PythonException ex) {
                    req.Tcs.TrySetResult(ex.ToString());
                } catch (Exception ex) {
                    req.Tcs.TrySetResult(ex.ToString());
                }
            }
        }

        PythonEngine.Shutdown();
    }
}

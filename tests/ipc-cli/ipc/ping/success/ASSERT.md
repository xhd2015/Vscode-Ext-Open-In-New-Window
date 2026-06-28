## Expected
- IPC response `ok` is true.
- Response includes a non-empty `version` string.

## Side Effects
- `openFolder` and `git.openRepository` are not called.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OK {
		t.Fatalf("ping must return ok=true, got error=%q", resp.Error)
	}
	if resp.Version == "" {
		t.Fatal("ping response must include version")
	}
	if resp.OpenFolderCalled {
		t.Fatal("ping must not call openFolder")
	}
	if resp.GitOpenCalled {
		t.Fatal("ping must not call git.openRepository")
	}
}
```
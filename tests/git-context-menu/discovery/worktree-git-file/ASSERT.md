## Expected
- Worktree repo is discovered and recognized as a git repository.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.IsGitRepository {
		t.Fatal("isGitRepository must be true for worktree .git file")
	}
	if !resp.WorktreePresent {
		t.Fatalf("worktree must be discovered; paths=%v", resp.DiscoveredPaths)
	}
}
```
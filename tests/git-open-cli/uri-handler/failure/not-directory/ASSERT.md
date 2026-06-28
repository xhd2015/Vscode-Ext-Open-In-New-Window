## Expected
- `git.openRepository` is not called.
- An error message is surfaced.

```go
import (
	"strings"
	"testing"
)

func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.GitOpenCalled {
		t.Fatal("git.openRepository must not be called for non-directory path")
	}
	if strings.TrimSpace(resp.ErrorMessage) == "" {
		t.Fatal("expected error message for non-directory path")
	}
}
```
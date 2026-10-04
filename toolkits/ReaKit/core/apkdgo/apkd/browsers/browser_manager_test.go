package browsers

import (
	"strings"
	"testing"
)

func TestGetRandomUserAgent(t *testing.T) {
	if userAgents == "" {
		t.Errorf("user_agents.txt should not be empty")
	}

	raw := strings.Split(userAgents, "\n")
	var agents []string
	for _, a := range raw {
		a = strings.TrimSpace(a)
		if a != "" {
			agents = append(agents, a)
		}
	}
	for i := 0; i < 10; i++ {
		ua := GetRandomUserAgent()

		if !contains(agents, ua) {
			t.Errorf("GetRandomUserAgent returned an invalid user agent: %s", ua)
		}
	}
}

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

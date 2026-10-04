package browsers

import (
	_ "embed"
	"math/rand"
	"strings"
	"time"
)

//go:embed user_agents.txt
var userAgents string

func GetRandomUserAgent() string {
	randomSource := rand.NewSource(time.Now().UnixNano())
	random := rand.New(randomSource)

	raw := strings.Split(userAgents, "\n")
	var agents []string
	for _, a := range raw {
		a = strings.TrimSpace(a)
		if a != "" {
			agents = append(agents, a)
		}
	}

	return agents[random.Intn(len(agents))]
}

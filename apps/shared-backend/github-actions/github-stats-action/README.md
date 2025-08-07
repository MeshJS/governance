# GitHub Stats Action

This GitHub Action triggers the GitHub stats collection background function to fetch and store repository statistics in the Supabase database.

## Usage

### Basic Usage

```yaml
- name: Collect GitHub Stats
  uses: ./.github/actions/github-stats-action
  with:
    org: 'your-organization'
    repo: 'your-repository'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### With Custom GitHub Token

```yaml
- name: Collect GitHub Stats
  uses: ./.github/actions/github-stats-action
  with:
    org: 'your-organization'
    repo: 'your-repository'
    github-token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `org` | GitHub organization name | Yes | - |
| `repo` | GitHub repository name | Yes | - |
| `github-token` | GitHub token for API access | Yes | - |

## What it does

This action:

1. Validates the provided inputs (org, repo, github-token)
2. Triggers the Netlify background function `github-stats-background`
3. The background function fetches and stores:
   - Repository information
   - Contributors
   - Commits with detailed statistics
   - Pull requests with reviews, assignees, labels, and commits
   - Issues with assignees and labels

## Requirements

- Node.js 18 or higher
- Valid GitHub token with appropriate permissions
- Access to the Netlify function endpoint

## Error Handling

The action includes comprehensive error handling:
- Input validation with detailed error messages
- HTTP request error handling
- Graceful handling of various response types
- Proper exit codes for CI/CD integration

## Security

- GitHub tokens are redacted in logs
- Input validation prevents injection attacks
- Uses HTTPS for all external requests

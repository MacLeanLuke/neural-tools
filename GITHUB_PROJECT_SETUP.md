# GitHub Project Setup Guide

This guide will help you create a GitHub Project board for the Neural Tools repository.

## Quick Setup (Recommended)

### Option 1: Using GitHub Web Interface

1. **Navigate to your repository**: https://github.com/MacLeanLuke/neural-tools

2. **Create a new Project**:
   - Click on the "Projects" tab
   - Click "Link a project" → "New project"
   - Choose a template:
     - **Team backlog** - For feature development and bug tracking
     - **Feature** - For planning specific features
     - **Bug tracker** - For managing bugs
     - **Blank** - Start from scratch

3. **Recommended Setup for Neural Tools**:
   - **Name**: Neural Tools Development
   - **Template**: Team backlog
   - **Description**: AI productivity toolkit development and release management

### Option 2: Using GitHub CLI

If you have the GitHub CLI installed:

```bash
# Create a new project
gh project create \
  --owner MacLeanLuke \
  --title "Neural Tools Development" \
  --format table

# Or create with a specific template
gh project create \
  --owner MacLeanLuke \
  --title "Neural Tools Development" \
  --template "Team backlog"
```

## Recommended Project Structure

### Fields

Add these custom fields to track work:

| Field Name | Type | Options |
|------------|------|---------|
| Status | Single select | Backlog, Todo, In Progress, In Review, Done |
| Priority | Single select | 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low |
| Size | Single select | XS (< 1h), S (1-4h), M (1-2d), L (3-5d), XL (1-2w) |
| Type | Single select | Feature, Bug, Docs, Chore, Refactor |
| Package | Single select | CLI, Core, Create, Vector-DB, Semantic-Cache, Fine-tune |
| Sprint | Iteration | 2-week sprints |

### Views

Create these views for different workflows:

#### 1. **Kanban Board** (Default)
- Group by: Status
- Filter: None
- Sort: Priority (descending)

#### 2. **Backlog**
- Group by: Priority
- Filter: Status = "Backlog" or "Todo"
- Sort: Priority (descending), Size (ascending)

#### 3. **Current Sprint**
- Group by: Status
- Filter: Sprint = "Current"
- Sort: Priority (descending)

#### 4. **By Package**
- Group by: Package
- Filter: Status != "Done"
- Sort: Priority (descending)

#### 5. **Bugs**
- Group by: Priority
- Filter: Type = "Bug", Status != "Done"
- Sort: Created (descending)

## Initial Issues to Add

Here are suggested initial issues for the Neural Tools project:

### High Priority Features
- [ ] Complete CLI command implementation
- [ ] Add vector database integration
- [ ] Implement semantic caching
- [ ] Create deployment templates (AWS/GCP)
- [ ] Build fine-tuning workflow tools

### Documentation
- [ ] Write getting started guide
- [ ] Document MCP development workflow
- [ ] Create API reference documentation
- [ ] Add deployment guides
- [ ] Write contributing guidelines

### Infrastructure
- [ ] Set up CI/CD pipeline
- [ ] Configure automated testing
- [ ] Set up package publishing workflow
- [ ] Add code quality checks
- [ ] Configure automated releases

### Examples & Templates
- [ ] Create GitHub automation example
- [ ] Create knowledge management example
- [ ] Add MCP templates
- [ ] Add Claude command templates
- [ ] Add agent templates

## Automation

Set up GitHub Actions automation for your project:

### 1. Auto-add Issues to Project

Create `.github/workflows/add-to-project.yml`:

```yaml
name: Add to Project
on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]

jobs:
  add-to-project:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/MacLeanLuke/projects/YOUR_PROJECT_NUMBER
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
```

### 2. Auto-update Status

Items automatically move through statuses:
- Issue opened → Backlog
- PR opened → In Review
- PR merged → Done

## Best Practices

### Issue Creation
- Use clear, descriptive titles
- Add appropriate labels
- Link related issues
- Estimate size before starting
- Add to current sprint when ready to work

### PR Workflow
- Link PRs to issues
- Request reviews from team
- Update project status
- Keep PRs focused and small

### Sprint Planning
- 2-week sprints
- Plan sprint goals
- Estimate capacity
- Review completed work
- Retrospective at end

## Quick Commands

```bash
# List projects
gh project list --owner MacLeanLuke

# View project
gh project view <number> --owner MacLeanLuke

# Create an issue and add to project
gh issue create --title "Add feature X" --body "Description" --project "Neural Tools Development"

# Close an issue
gh issue close <number>

# List issues in project
gh project item-list <number> --owner MacLeanLuke
```

## Next Steps

1. ✅ Create the GitHub Project
2. ✅ Add custom fields
3. ✅ Create views
4. ✅ Add initial issues
5. ✅ Set up automation
6. ✅ Start planning first sprint

## Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub CLI Projects Reference](https://cli.github.com/manual/gh_project)
- [Projects API](https://docs.github.com/en/graphql/reference/objects#project)

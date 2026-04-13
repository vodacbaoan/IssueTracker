'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import { getLabels, type Label } from './api/labels';
import {
  createIssue,
  getIssues,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  updateIssueAssignee,
  updateIssueLabels,
  updateIssueStatus,
} from './api/issues';
import { createProject, getProjects, type Project } from './api/projects';
import { getUsers, type User } from './api/users';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function formatIssueStatus(status: IssueStatus): string {
  switch (status) {
    case 'todo':
      return 'To do';
    case 'in_progress':
      return 'In progress';
    case 'done':
      return 'Done';
    default:
      return status;
  }
}

function formatIssuePriority(priority: IssuePriority): string {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    default:
      return priority;
  }
}

function toggleIdInList(currentIds: string[], id: string): string[] {
  return currentIds.includes(id)
    ? currentIds.filter((currentId) => currentId !== id)
    : [...currentIds, id];
}

const ISSUE_PRIORITIES: IssuePriority[] = ['low', 'medium', 'high'];
const ISSUE_STATUSES: IssueStatus[] = ['todo', 'in_progress', 'done'];

const ISSUE_SECTION_COPY: Record<IssueStatus, string> = {
  todo: 'Ideas ready for the next focused push.',
  in_progress: 'Work that is currently moving through delivery.',
  done: 'Completed items kept for handoff and reference.',
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePriority, setIssuePriority] = useState<IssuePriority>('medium');
  const [issueAssigneeId, setIssueAssigneeId] = useState('');
  const [issueLabelIds, setIssueLabelIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | IssuePriority>('all');
  const [assigneeFilterId, setAssigneeFilterId] = useState('all');
  const [labelFilterId, setLabelFilterId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [labelsError, setLabelsError] = useState<string | null>(null);
  const [statusUpdatingIssueId, setStatusUpdatingIssueId] = useState<string | null>(null);
  const [assigneeUpdatingIssueId, setAssigneeUpdatingIssueId] = useState<string | null>(null);
  const [labelUpdatingIssueId, setLabelUpdatingIssueId] = useState<string | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  const loadProjects = async (): Promise<void> => {
    setLoading(true);
    setProjectError(null);

    try {
      const nextProjects = await getProjects();
      setProjects(nextProjects);
    } catch (loadError) {
      setProjectError(loadError instanceof Error ? loadError.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (): Promise<void> => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const nextUsers = await getUsers();
      setUsers(nextUsers);
    } catch (loadError) {
      setUsersError(loadError instanceof Error ? loadError.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadLabels = async (): Promise<void> => {
    setLabelsLoading(true);
    setLabelsError(null);

    try {
      const nextLabels = await getLabels();
      setLabels(nextLabels);
    } catch (loadError) {
      setLabelsError(loadError instanceof Error ? loadError.message : 'Failed to load labels');
    } finally {
      setLabelsLoading(false);
    }
  };

  const loadIssues = async (projectId: string): Promise<void> => {
    setIssuesLoading(true);
    setIssueError(null);

    try {
      const nextIssues = await getIssues(projectId);
      setIssues(nextIssues);
    } catch (loadError) {
      setIssueError(loadError instanceof Error ? loadError.message : 'Failed to load issues');
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
    void loadUsers();
    void loadLabels();
  }, []);

  useEffect(() => {
    if (!loading && projects.length === 0) {
      setIsProjectFormOpen(true);
    }
  }, [loading, projects.length]);

  useEffect(() => {
    setSelectedProjectId((currentProjectId) => {
      if (projects.length === 0) {
        return null;
      }

      if (currentProjectId && projects.some((project) => project.id === currentProjectId)) {
        return currentProjectId;
      }

      return null;
    });
  }, [projects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setIssues([]);
      setIssueError(null);
      return;
    }

    setIssues([]);
    void loadIssues(selectedProjectId);
  }, [selectedProjectId]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setProjectError(null);

    try {
      const project = await createProject({
        name,
        description: description || undefined,
      });
      setName('');
      setDescription('');
      setIsProjectFormOpen(false);
      setSelectedProjectId(project.id);
      await loadProjects();
    } catch (submitError) {
      setProjectError(submitError instanceof Error ? submitError.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    setIssueSubmitting(true);
    setIssueError(null);

    try {
      await createIssue(selectedProjectId, {
        title: issueTitle,
        description: issueDescription || undefined,
        priority: issuePriority,
        assigneeId: issueAssigneeId || null,
        labelIds: issueLabelIds,
      });
      setIssueTitle('');
      setIssueDescription('');
      setIssuePriority('medium');
      setIssueAssigneeId('');
      setIssueLabelIds([]);
      await loadIssues(selectedProjectId);
    } catch (submitError) {
      setIssueError(submitError instanceof Error ? submitError.message : 'Failed to create issue');
    } finally {
      setIssueSubmitting(false);
    }
  };

  const handleIssueStatusChange = async (issueId: string, status: IssueStatus): Promise<void> => {
    if (!selectedProjectId) {
      return;
    }

    setStatusUpdatingIssueId(issueId);
    setIssueError(null);

    try {
      await updateIssueStatus(selectedProjectId, issueId, status);
      await loadIssues(selectedProjectId);
    } catch (updateError) {
      setIssueError(updateError instanceof Error ? updateError.message : 'Failed to update issue');
    } finally {
      setStatusUpdatingIssueId(null);
    }
  };

  const handleIssueAssigneeChange = async (
    issueId: string,
    assigneeId: string | null,
  ): Promise<void> => {
    if (!selectedProjectId) {
      return;
    }

    setAssigneeUpdatingIssueId(issueId);
    setIssueError(null);

    try {
      await updateIssueAssignee(selectedProjectId, issueId, assigneeId);
      await loadIssues(selectedProjectId);
    } catch (updateError) {
      setIssueError(
        updateError instanceof Error ? updateError.message : 'Failed to update assignment',
      );
    } finally {
      setAssigneeUpdatingIssueId(null);
    }
  };

  const handleIssueLabelsChange = async (
    issueId: string,
    labelIds: string[],
  ): Promise<void> => {
    if (!selectedProjectId) {
      return;
    }

    setLabelUpdatingIssueId(issueId);
    setIssueError(null);

    try {
      await updateIssueLabels(selectedProjectId, issueId, labelIds);
      await loadIssues(selectedProjectId);
    } catch (updateError) {
      setIssueError(
        updateError instanceof Error ? updateError.message : 'Failed to update labels',
      );
    } finally {
      setLabelUpdatingIssueId(null);
    }
  };

  const getAssigneeName = (assigneeId: string | null): string => {
    if (!assigneeId) {
      return 'Unassigned';
    }

    return users.find((user) => user.id === assigneeId)?.name ?? 'Unknown user';
  };

  const clearFilters = (): void => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilterId('all');
    setLabelFilterId('all');
  };

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      issue.title.toLowerCase().includes(normalizedSearchQuery) ||
      issue.description?.toLowerCase().includes(normalizedSearchQuery) ||
      getAssigneeName(issue.assigneeId).toLowerCase().includes(normalizedSearchQuery) ||
      issue.labels.some((label) => label.name.toLowerCase().includes(normalizedSearchQuery));

    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    const matchesAssignee = assigneeFilterId === 'all' || issue.assigneeId === assigneeFilterId;
    const matchesLabel =
      labelFilterId === 'all' || issue.labels.some((label) => label.id === labelFilterId);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesLabel;
  });
  const groupedIssues = ISSUE_STATUSES.map((status) => ({
    status,
    label: formatIssueStatus(status),
    description: ISSUE_SECTION_COPY[status],
    items: filteredIssues.filter((issue) => issue.status === status),
  }));
  const openIssueCount = issues.filter((issue) => issue.status !== 'done').length;
  const doneIssueCount = issues.filter((issue) => issue.status === 'done').length;
  const unassignedIssueCount = issues.filter((issue) => !issue.assigneeId).length;
  const activeFilterCount = [searchQuery, statusFilter, priorityFilter, assigneeFilterId, labelFilterId]
    .filter((value) => value !== '' && value !== 'all')
    .length;

  return (
    <main className="page-shell">
      <header className="panel dashboard-header">
        <div className="dashboard-copy">
          <p className="eyebrow">Issue tracker</p>
          <h1>Delivery workspace</h1>
          <p className="intro">
            Keep projects, priorities, labels, and ownership aligned in one calm space built for
            daily momentum.
          </p>
        </div>

        <div className="header-stats">
          <article className="stat-chip">
            <span>Projects</span>
            <strong>{loading ? '...' : projects.length}</strong>
          </article>
          <article className="stat-chip">
            <span>People</span>
            <strong>{usersLoading ? '...' : users.length}</strong>
          </article>
        </div>
      </header>

      <section className="workspace-shell">
        <aside className="panel project-rail">
          <div className="rail-header">
            <div>
              <p className="eyebrow">Projects</p>
              <h2>Project rail</h2>
            </div>
            <button
              className="secondary-button rail-action"
              type="button"
              onClick={() => void loadProjects()}
            >
              Refresh
            </button>
          </div>

          <button
            aria-controls="new-project-panel"
            aria-expanded={isProjectFormOpen}
            className={`toggle-button ${isProjectFormOpen ? 'toggle-button-active' : ''}`}
            onClick={() => setIsProjectFormOpen((currentState) => !currentState)}
            type="button"
          >
            {isProjectFormOpen ? 'Hide new project' : 'New project'}
          </button>

          {isProjectFormOpen ? (
            <section className="create-project-panel" id="new-project-panel">
              <div className="panel-heading">
                <h3>Start a project</h3>
                <p>Create a new track for incoming work and open it in the workspace immediately.</p>
              </div>

              <form className="project-form compact-form" onSubmit={(event) => void handleSubmit(event)}>
                <label>
                  <span>Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex: CRM Dashboard"
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Short description of the project"
                    maxLength={1000}
                    rows={4}
                  />
                </label>

                <button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Create project'}
                </button>
              </form>
            </section>
          ) : null}

          {projectError ? <p className="message error">{projectError}</p> : null}
          {loading ? <p className="message">Loading projects...</p> : null}

          {!loading && projects.length === 0 ? (
            <p className="message rail-empty">
              No projects yet. Open the panel above to create the first one.
            </p>
          ) : null}

          {!loading && projects.length > 0 ? (
            <div className="project-entries">
              {projects.map((project) => {
                const isSelected = project.id === selectedProjectId;

                return (
                  <button
                    className={`project-tile ${isSelected ? 'project-tile-selected' : ''}`}
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    type="button"
                  >
                    <div className="project-tile-top">
                      <div>
                        <span className="project-tile-title">{project.name}</span>
                        <span className="project-tile-meta">{formatDate(project.createdAt)}</span>
                      </div>
                      <span className="project-tile-state">{isSelected ? 'Live' : 'Open'}</span>
                    </div>
                    <p className="project-tile-copy">
                      {project.description || 'No description provided yet.'}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </aside>

        <section className="workspace-main">
          {!selectedProject ? (
            <section className="panel workspace-empty">
              <p className="eyebrow">Workspace</p>
              <h2>Pick a project to open the issue workspace</h2>
              <p className="intro">
                Choose something from the rail to see backlog, ownership, and progress in one
                focused view.
              </p>
            </section>
          ) : (
            <>
              <section className="panel workspace-hero">
                <div className="workspace-hero-header">
                  <div>
                    <p className="eyebrow">Selected project</p>
                    <h2>{selectedProject.name}</h2>
                    <p className="workspace-description">
                      {selectedProject.description ||
                        'No description yet. Add one when you want more context for the team.'}
                    </p>
                  </div>
                  <span className="workspace-date">Created {formatDate(selectedProject.createdAt)}</span>
                </div>

                <div className="summary-grid">
                  <article className="summary-card">
                    <span>Open issues</span>
                    <strong>{openIssueCount}</strong>
                  </article>
                  <article className="summary-card">
                    <span>Done</span>
                    <strong>{doneIssueCount}</strong>
                  </article>
                  <article className="summary-card">
                    <span>Unassigned</span>
                    <strong>{unassignedIssueCount}</strong>
                  </article>
                </div>
              </section>

              <section className="panel composer-panel">
                <div className="section-heading composer-heading">
                  <div>
                    <p className="eyebrow">Create issue</p>
                    <h2>Capture the next task</h2>
                  </div>
                </div>

                <form className="project-form issue-form-grid" onSubmit={(event) => void handleIssueSubmit(event)}>
                  <label className="issue-title-field">
                    <span>Issue title</span>
                    <input
                      value={issueTitle}
                      onChange={(event) => setIssueTitle(event.target.value)}
                      placeholder="Ex: Fix login bug"
                      minLength={2}
                      maxLength={160}
                      required
                    />
                  </label>

                  <label className="issue-description-field">
                    <span>Description</span>
                    <textarea
                      value={issueDescription}
                      onChange={(event) => setIssueDescription(event.target.value)}
                      placeholder="Add a little more context so someone else can pick this up quickly."
                      maxLength={2000}
                      rows={4}
                    />
                  </label>

                  <label>
                    <span>Priority</span>
                    <select
                      value={issuePriority}
                      onChange={(event) => setIssuePriority(event.target.value as IssuePriority)}
                    >
                      {ISSUE_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {formatIssuePriority(priority)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Assignee</span>
                    <select
                      value={issueAssigneeId}
                      onChange={(event) => setIssueAssigneeId(event.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button className="issue-submit-button" type="submit" disabled={issueSubmitting}>
                    {issueSubmitting ? 'Saving...' : 'Create issue'}
                  </button>

                  <fieldset className="label-field issue-label-field">
                    <legend>Labels</legend>
                    <div className="label-toggle-grid">
                      {labels.map((label) => {
                        const isSelected = issueLabelIds.includes(label.id);

                        return (
                          <button
                            aria-pressed={isSelected}
                            className={`label-toggle ${isSelected ? 'label-toggle-active' : ''}`}
                            disabled={labelsLoading}
                            key={label.id}
                            onClick={() =>
                              setIssueLabelIds((currentIds) => toggleIdInList(currentIds, label.id))
                            }
                            type="button"
                          >
                            {label.name}
                          </button>
                        );
                      })}
                    </div>

                    {!labelsLoading && labels.length === 0 ? (
                      <p className="message">No labels available yet.</p>
                    ) : null}
                  </fieldset>
                </form>

                {issueError ? <p className="message error">{issueError}</p> : null}
                {usersError ? <p className="message error">{usersError}</p> : null}
                {labelsError ? <p className="message error">{labelsError}</p> : null}
                {issuesLoading ? <p className="message">Loading issues...</p> : null}
                {usersLoading ? <p className="message">Loading users...</p> : null}
                {labelsLoading ? <p className="message">Loading labels...</p> : null}
              </section>

              <section className="panel filters-panel">
                <div className="section-heading filters-heading">
                  <div>
                    <p className="eyebrow">Refine board</p>
                    <h2>Find the right slice of work</h2>
                  </div>
                  <p className="filter-summary">
                    Showing {filteredIssues.length} of {issues.length} issues
                  </p>
                </div>

                <div className="filter-grid">
                  <label className="filter-search-field">
                    <span>Search</span>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search title, description, assignee, or label"
                    />
                  </label>

                  <label>
                    <span>Status</span>
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value as 'all' | IssueStatus)
                      }
                    >
                      <option value="all">All statuses</option>
                      {ISSUE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatIssueStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Priority</span>
                    <select
                      value={priorityFilter}
                      onChange={(event) =>
                        setPriorityFilter(event.target.value as 'all' | IssuePriority)
                      }
                    >
                      <option value="all">All priorities</option>
                      {ISSUE_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {formatIssuePriority(priority)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Assignee</span>
                    <select
                      value={assigneeFilterId}
                      onChange={(event) => setAssigneeFilterId(event.target.value)}
                    >
                      <option value="all">Anyone</option>
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Label</span>
                    <select
                      value={labelFilterId}
                      onChange={(event) => setLabelFilterId(event.target.value)}
                    >
                      <option value="all">All labels</option>
                      {labels.map((label) => (
                        <option key={label.id} value={label.id}>
                          {label.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    className="secondary-button filter-clear-button"
                    disabled={activeFilterCount === 0}
                    onClick={clearFilters}
                    type="button"
                  >
                    Clear filters
                  </button>
                </div>

                {filteredIssues.length === 0 && issues.length > 0 ? (
                  <p className="message">No issues match the current filters yet.</p>
                ) : null}
              </section>

              <div className="status-stack">
                {groupedIssues.map((group) => (
                  <section className="panel status-section" key={group.status}>
                    <div className="status-section-header">
                      <div>
                        <div className="status-section-title">
                          <span className={`status-pill status-${group.status}`}>{group.label}</span>
                          <strong>{group.items.length}</strong>
                        </div>
                        <p className="status-section-copy">{group.description}</p>
                      </div>
                    </div>

                    {!issuesLoading && group.items.length === 0 ? (
                      <p className="message section-empty">No issues in {group.label.toLowerCase()}.</p>
                    ) : null}

                    {!issuesLoading && group.items.length > 0 ? (
                      <div className="issue-column">
                        {group.items.map((issue) => (
                          <article className="issue-card" key={issue.id}>
                            <div className="issue-card-header">
                              <div className="issue-card-copy">
                                <h3>{issue.title}</h3>
                                <span>{formatDate(issue.createdAt)}</span>
                              </div>
                              <div className="issue-badges">
                                <span className={`priority-pill priority-${issue.priority}`}>
                                  {formatIssuePriority(issue.priority)}
                                </span>
                                <span className={`status-pill status-${issue.status}`}>
                                  {formatIssueStatus(issue.status)}
                                </span>
                              </div>
                            </div>

                            {issue.description ? (
                              <p className="issue-description">{issue.description}</p>
                            ) : null}

                            <div className="issue-label-block">
                              <div className="issue-label-list">
                                {issue.labels.length > 0 ? (
                                  issue.labels.map((label) => (
                                    <span className="label-pill" key={label.id}>
                                      {label.name}
                                    </span>
                                  ))
                                ) : (
                                  <p className="message">No labels yet.</p>
                                )}
                              </div>

                              {labels.length > 0 ? (
                                <div className="issue-label-editor">
                                  <span>Retag</span>
                                  <div className="label-toggle-grid">
                                    {labels.map((label) => {
                                      const isSelected = issue.labels.some(
                                        (issueLabel) => issueLabel.id === label.id,
                                      );

                                      return (
                                        <button
                                          aria-pressed={isSelected}
                                          className={`label-toggle ${
                                            isSelected ? 'label-toggle-active' : ''
                                          }`}
                                          disabled={
                                            labelsLoading || labelUpdatingIssueId === issue.id
                                          }
                                          key={label.id}
                                          onClick={() =>
                                            void handleIssueLabelsChange(
                                              issue.id,
                                              toggleIdInList(
                                                issue.labels.map((issueLabel) => issueLabel.id),
                                                label.id,
                                              ),
                                            )
                                          }
                                          type="button"
                                        >
                                          {label.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            <div className="status-actions">
                              {ISSUE_STATUSES.map((status) => (
                                <button
                                  className={`status-button ${
                                    issue.status === status ? 'status-button-active' : ''
                                  }`}
                                  disabled={
                                    statusUpdatingIssueId === issue.id || issue.status === status
                                  }
                                  key={status}
                                  onClick={() => void handleIssueStatusChange(issue.id, status)}
                                  type="button"
                                >
                                  {formatIssueStatus(status)}
                                </button>
                              ))}
                            </div>

                            <div className="issue-assignment">
                              <p className="message">Assigned to: {getAssigneeName(issue.assigneeId)}</p>
                              <label className="issue-assignment-control">
                                <span>Reassign</span>
                                <select
                                  value={issue.assigneeId ?? ''}
                                  disabled={assigneeUpdatingIssueId === issue.id || usersLoading}
                                  onChange={(event) =>
                                    void handleIssueAssigneeChange(issue.id, event.target.value || null)
                                  }
                                >
                                  <option value="">Unassigned</option>
                                  {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

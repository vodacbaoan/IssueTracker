'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import {
  createIssue,
  getIssues,
  type Issue,
  type IssueStatus,
  updateIssueStatus,
} from './api/issues';
import { createProject, getProjects, type Project } from './api/projects';

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

const ISSUE_STATUSES: IssueStatus[] = ['todo', 'in_progress', 'done'];

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueTitle, setIssueTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [statusUpdatingIssueId, setStatusUpdatingIssueId] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    setSelectedProjectId((currentProjectId) => {
      if (projects.length === 0) {
        return null;
      }

      if (currentProjectId && projects.some((project) => project.id === currentProjectId)) {
        return currentProjectId;
      }

      return projects[0].id;
    });
  }, [projects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setIssues([]);
      setIssueError(null);
      return;
    }

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
      await createIssue(selectedProjectId, { title: issueTitle });
      setIssueTitle('');
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

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Simple Full-Stack Starter</p>
        <h1>Projects dashboard</h1>
        <p className="intro">
          This page reads projects from the Express backend and writes new ones to PostgreSQL through Prisma.
        </p>
      </section>

      <section className="layout-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>Add a project</h2>
            </div>
          </div>

          <form className="project-form" onSubmit={(event) => void handleSubmit(event)}>
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

          {projectError ? <p className="message error">{projectError}</p> : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Read</p>
              <h2>Existing projects</h2>
            </div>
            <button className="secondary-button" type="button" onClick={() => void loadProjects()}>
              Refresh
            </button>
          </div>

          {loading ? <p className="message">Loading projects...</p> : null}

          {!loading && projects.length === 0 ? (
            <p className="message">No projects yet. Create the first one using the form.</p>
          ) : null}

          {!loading && projects.length > 0 ? (
            <div className="project-list">
              {projects.map((project) => (
                <article
                  className={`project-card ${
                    project.id === selectedProjectId ? 'project-card-selected' : ''
                  }`}
                  key={project.id}
                >
                  <div className="project-card-header">
                    <div>
                      <h3>{project.name}</h3>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    <button
                      className="secondary-button project-select-button"
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      disabled={project.id === selectedProjectId}
                    >
                      {project.id === selectedProjectId ? 'Selected' : 'Open issues'}
                    </button>
                  </div>
                  <p>{project.description || 'No description provided yet.'}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Issues</p>
              <h2>{selectedProject ? selectedProject.name : 'Select a project'}</h2>
            </div>
          </div>

          {!selectedProject ? (
            <p className="message">Select a project from the list to create and manage issues.</p>
          ) : (
            <div className="issue-workspace">
              <p className="message issue-context">
                Manage the issue workflow for <strong>{selectedProject.name}</strong>.
              </p>

              <form className="project-form" onSubmit={(event) => void handleIssueSubmit(event)}>
                <label>
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

                <button type="submit" disabled={issueSubmitting}>
                  {issueSubmitting ? 'Saving...' : 'Create issue'}
                </button>
              </form>

              {issueError ? <p className="message error">{issueError}</p> : null}
              {issuesLoading ? <p className="message">Loading issues...</p> : null}

              {!issuesLoading && issues.length === 0 ? (
                <p className="message">No issues yet. Create the first one for this project.</p>
              ) : null}

              {!issuesLoading && issues.length > 0 ? (
                <div className="project-list">
                  {issues.map((issue) => (
                    <article className="project-card issue-card" key={issue.id}>
                      <div className="issue-card-header">
                        <div>
                          <h3>{issue.title}</h3>
                          <span>{formatDate(issue.createdAt)}</span>
                        </div>
                        <span className={`status-pill status-${issue.status}`}>
                          {formatIssueStatus(issue.status)}
                        </span>
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
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

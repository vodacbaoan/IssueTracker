import { FormEvent, useEffect, useState } from 'react';
import { createProject, getProjects, type Project } from './api/projects';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const nextProjects = await getProjects();
      setProjects(nextProjects);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createProject({
        name,
        description: description || undefined,
      });
      setName('');
      setDescription('');
      await loadProjects();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

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

          {error ? <p className="message error">{error}</p> : null}
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
                <article className="project-card" key={project.id}>
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                  <p>{project.description || 'No description provided yet.'}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

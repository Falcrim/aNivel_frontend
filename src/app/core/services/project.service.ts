import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateProjectDto, Project, UpdateProjectDto } from '../models/project.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/projects/`;

  private readonly _projects = signal<Project[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _selectedProject = signal<Project | null>(null);

  readonly projects = this._projects.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedProject = this._selectedProject.asReadonly();

  loadProjects(): Observable<Project[]> {
    this._loading.set(true);
    return this.http.get<Project[]>(this.apiUrl).pipe(
      tap((data) => {
        this._projects.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  getProjectById(id: number): Observable<Project> {
    this._loading.set(true);
    return this.http.get<Project>(`${this.apiUrl}${id}/`).pipe(
      tap((project) => {
        this._selectedProject.set(project);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, dto).pipe(
      tap((newProject) => {
        this._projects.update((list) => [newProject, ...list]);
        this.toast.success('Obra creada', `La obra "${newProject.name}" se creó correctamente.`);
      })
    );
  }

  updateProject(id: number, dto: UpdateProjectDto): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._projects.update((list) =>
          list.map((p) => (p.id === id ? updated : p))
        );
        if (this._selectedProject()?.id === id) {
          this._selectedProject.set(updated);
        }
        this.toast.success('Obra actualizada', `La obra se renombró a "${updated.name}".`);
      })
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._projects().find((p) => p.id === id);
        this._projects.update((list) => list.filter((p) => p.id !== id));
        if (this._selectedProject()?.id === id) {
          this._selectedProject.set(null);
        }
        this.toast.success('Obra eliminada', `La obra "${target?.name || ''}" fue eliminada.`);
      })
    );
  }
}

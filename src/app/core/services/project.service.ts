import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateProjectDto, Project, UpdateProjectDto } from '../models/project.model';
import { PaginatedResponse } from '../models/pagination.model';
import { extractResults } from '../utils/pagination.utils';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/projects/`;

  private readonly _projects = signal<Project[]>([]);
  private readonly _totalCount = signal<number>(0);
  private readonly _loading = signal<boolean>(false);
  private readonly _selectedProject = signal<Project | null>(null);

  readonly projects = this._projects.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedProject = this._selectedProject.asReadonly();

  loadProjects(filters?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
  }): Observable<Project[]> {
    this._loading.set(true);

    let params = new HttpParams();
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.page_size) {
      params = params.set('page_size', filters.page_size.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.ordering) {
      params = params.set('ordering', filters.ordering);
    }

    return this.http.get<PaginatedResponse<Project> | Project[]>(this.apiUrl, { params }).pipe(
      map((response) => extractResults(response)),
      tap(({ items, totalCount }) => {
        this._projects.set(items);
        this._totalCount.set(totalCount);
      }),
      map(({ items }) => items),
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
        this._totalCount.update((count) => count + 1);
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
        this._totalCount.update((count) => Math.max(0, count - 1));
        if (this._selectedProject()?.id === id) {
          this._selectedProject.set(null);
        }
        this.toast.success('Obra eliminada', `La obra "${target?.name || ''}" fue eliminada.`);
      })
    );
  }
}

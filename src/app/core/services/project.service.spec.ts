import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { Project } from '../models/project.model';
import { ProjectService } from './project.service';
import { ToastService } from './toast.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/core/projects/`;

  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Edificio Los Pinos',
      status: 'active',
      status_display: 'En Ejecución',
      built_area: 500,
      exchange_rate: 6.96,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        ToastService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and have initial empty state', () => {
    expect(service).toBeTruthy();
    expect(service.projects()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.totalCount()).toBe(0);
    expect(service.selectedProject()).toBeNull();
  });

  it('should load projects from PaginatedResponse and update signals', () => {
    service.loadProjects({ page: 1, page_size: 25 }).subscribe((projects) => {
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Edificio Los Pinos');
    });

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(`${apiUrl}?page=1&page_size=25`);
    expect(req.request.method).toBe('GET');
    req.flush({
      count: 1,
      next: null,
      previous: null,
      results: mockProjects,
    });

    expect(service.projects().length).toBe(1);
    expect(service.totalCount()).toBe(1);
    expect(service.loading()).toBe(false);
  });

  it('should load projects from flat array response', () => {
    service.loadProjects().subscribe((projects) => {
      expect(projects.length).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);

    expect(service.projects().length).toBe(1);
    expect(service.totalCount()).toBe(1);
  });

  it('should get project by id and set selectedProject signal', () => {
    service.getProjectById(1).subscribe((project) => {
      expect(project.id).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}1/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects[0]);

    expect(service.selectedProject()).toEqual(mockProjects[0]);
    expect(service.loading()).toBe(false);
  });

  it('should create project and prepend to projects signal', () => {
    const newDto = { name: 'Residencial Nueva' };
    const createdProject: Project = {
      ...mockProjects[0],
      id: 2,
      name: 'Residencial Nueva',
    };

    service.createProject(newDto).subscribe((p) => {
      expect(p.name).toBe('Residencial Nueva');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newDto);
    req.flush(createdProject);

    expect(service.projects().length).toBe(1);
    expect(service.projects()[0].id).toBe(2);
    expect(service.totalCount()).toBe(1);
  });

  it('should update project and update matching item in list', () => {
    service['_projects'].set(mockProjects);
    service['_selectedProject'].set(mockProjects[0]);

    const updateDto = { name: 'Edificio Los Pinos - Fase 2' };
    const updatedProject: Project = {
      ...mockProjects[0],
      name: 'Edificio Los Pinos - Fase 2',
    };

    service.updateProject(1, updateDto).subscribe((p) => {
      expect(p.name).toBe('Edificio Los Pinos - Fase 2');
    });

    const req = httpMock.expectOne(`${apiUrl}1/`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedProject);

    expect(service.projects()[0].name).toBe('Edificio Los Pinos - Fase 2');
    expect(service.selectedProject()?.name).toBe('Edificio Los Pinos - Fase 2');
  });

  it('should delete project and remove it from list', () => {
    service['_projects'].set(mockProjects);
    service['_totalCount'].set(1);
    service['_selectedProject'].set(mockProjects[0]);

    service.deleteProject(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.projects().length).toBe(0);
    expect(service.totalCount()).toBe(0);
    expect(service.selectedProject()).toBeNull();
  });
});

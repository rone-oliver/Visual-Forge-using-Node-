import { TestBed } from '@angular/core/testing';

import { EditorManagementService } from './editor-management.service';

describe('EditorManagementService', () => {
  let service: EditorManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

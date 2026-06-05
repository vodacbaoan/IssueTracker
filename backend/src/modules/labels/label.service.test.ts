import type { Label } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { LabelRepository } from './label.repository';
import { LabelService } from './label.service';

type MockLabelRepository = Pick<LabelRepository, 'list'>;

const createLabelRepository = () =>
  ({
    list: vi.fn(),
  }) satisfies MockLabelRepository;

const createService = (labelRepository: MockLabelRepository) =>
  new LabelService(labelRepository as unknown as LabelRepository);

describe('LabelService', () => {
  it('lists labels from the repository', async () => {
    const labels: Label[] = [];
    const labelRepository = createLabelRepository();
    labelRepository.list.mockResolvedValue(labels);
    const service = createService(labelRepository);

    const result = await service.listLabels();

    expect(result).toBe(labels);
    expect(labelRepository.list).toHaveBeenCalledOnce();
  });
});

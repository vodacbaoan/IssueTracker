import type { Label } from '@prisma/client';
import type { LabelRepository } from './label.repository';

export class LabelService {
  constructor(private readonly labelRepository: LabelRepository) {}

  listLabels(): Promise<Label[]> {
    return this.labelRepository.list();
  }
}

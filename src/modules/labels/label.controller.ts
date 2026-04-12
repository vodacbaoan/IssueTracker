import type { NextFunction, Request, Response } from 'express';
import type { LabelService } from './label.service';

export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  list = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const labels = await this.labelService.listLabels();
      response.json(labels);
    } catch (error) {
      next(error);
    }
  };
}

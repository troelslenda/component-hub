import { Injectable, NotFoundException } from '@nestjs/common';
import dateRangePickerMetadata from '@organization/date-range-picker/metadata';
import dateRangePickerPackage from '@organization/date-range-picker/package';
import notificationBannerMetadata from '@organization/notification-banner/metadata';
import notificationBannerPackage from '@organization/notification-banner/package';

export interface ComponentRecord {
  id: string;
  name: string;
  packageName: string;
  status: string;
  owners: string[];
  description: string;
  figmaUrl: string | null;
  releaseState: string;
  sourceVersion: string;
  storyId: string;
  repositoryPath: string;
  releases: Array<{ version: string; date: string }>;
}

@Injectable()
export class AppService {
  private readonly components: ComponentRecord[] = [
    {
      ...dateRangePickerMetadata,
      sourceVersion: dateRangePickerPackage.version,
      storyId: 'components-date-range-picker--showcase',
      repositoryPath: 'packages/components/date-range-picker',
      releases: [],
    },
    {
      ...notificationBannerMetadata,
      sourceVersion: notificationBannerPackage.version,
      storyId: 'components-notification-banner--showcase',
      repositoryPath: 'packages/components/notification-banner',
      releases: [],
    },
  ];

  listComponents(): ComponentRecord[] {
    return this.components;
  }

  getComponent(componentId: string): ComponentRecord {
    const component = this.components.find(({ id }) => id === componentId);
    if (!component) throw new NotFoundException(`Component '${componentId}' was not found.`);
    return component;
  }
}

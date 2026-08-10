import type { Meta, StoryObj } from '@storybook/angular';
import { NotificationBanner } from './notification-banner';

const meta: Meta<NotificationBanner> = {
  title: 'Components/Notification Banner',
  component: NotificationBanner,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<NotificationBanner>;

export const Showcase: Story = {};

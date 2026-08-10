import type { Meta, StoryObj } from '@storybook/angular';
import { DateRangePicker } from './date-range-picker';

const meta: Meta<DateRangePicker> = {
  title: 'Components/Date Range Picker',
  component: DateRangePicker,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<DateRangePicker>;

export const Showcase: Story = {};

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface MetricCard {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface BookingMetricsCardsProps {
  metrics: MetricCard[];
}

const BookingMetricsCards = ({ metrics }: BookingMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="bg-card rounded-lg border border-border p-6 shadow-hospitality-sm hover:shadow-hospitality transition-smooth"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon
                name={metric.icon as any}
                variant="solid"
                size={24}
                className="text-primary"
              />
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-caption font-medium ${
                metric.changeType === 'positive' ?'bg-success/10 text-success'
                  : metric.changeType === 'negative' ?'bg-error/10 text-error' :'bg-muted text-text-secondary'
              }`}
            >
              {metric.changeType === 'positive' && (
                <Icon
                  name="ArrowUpIcon"
                  variant="solid"
                  size={12}
                  className="text-success"
                />
              )}
              {metric.changeType === 'negative' && (
                <Icon
                  name="ArrowDownIcon"
                  variant="solid"
                  size={12}
                  className="text-error"
                />
              )}
              {metric.change}
            </div>
          </div>
          <div>
            <p className="text-text-secondary text-sm font-caption mb-1">
              {metric.label}
            </p>
            <p className="text-text-primary text-2xl font-heading font-semibold">
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingMetricsCards;
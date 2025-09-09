import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatsCards } from '@/components/dashboard/StatsCards'

describe('StatsCards', () => {
  const defaultProps = {
    totalEvents: 5,
    totalParticipants: 20,
    totalAmount: 50000,
    totalGroups: 3,
  }

  it('should render all stat cards', () => {
    render(<StatsCards {...defaultProps} />)

    expect(screen.getByText('総イベント数')).toBeInTheDocument()
    expect(screen.getByText('総参加者数')).toBeInTheDocument()
    expect(screen.getByText('総支出額')).toBeInTheDocument()
    expect(screen.getByText('グループ数')).toBeInTheDocument()
  })

  it('should display correct values', () => {
    render(<StatsCards {...defaultProps} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('¥50,000')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should format large amounts with commas', () => {
    render(<StatsCards {...defaultProps} totalAmount={1234567} />)

    expect(screen.getByText('¥1,234,567')).toBeInTheDocument()
  })

  it('should handle zero values', () => {
    render(
      <StatsCards
        totalEvents={0}
        totalParticipants={0}
        totalAmount={0}
        totalGroups={0}
      />
    )

    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(3) // Events, Participants, Groups
    expect(screen.getByText('¥0')).toBeInTheDocument()
  })

  it('should have proper grid layout', () => {
    const { container } = render(<StatsCards {...defaultProps} />)
    
    const gridContainer = container.firstChild
    expect(gridContainer).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-4')
  })
})
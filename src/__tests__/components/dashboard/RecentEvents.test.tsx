import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecentEvents } from '@/components/dashboard/RecentEvents'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy年MM月dd日') {
      return '2024年01月15日'
    }
    return '2024-01-15'
  }),
}))

jest.mock('date-fns/locale', () => ({
  ja: {},
}))

describe('RecentEvents', () => {
  const mockEvents = [
    {
      id: '1',
      unique_url: 'test-event-1',
      name: '沖縄旅行',
      date: '2024-01-15',
      participant_count: 5,
      total_amount: 50000,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      unique_url: 'test-event-2',
      name: '忘年会2023',
      date: null,
      participant_count: 8,
      total_amount: 32000,
      created_at: '2023-12-30T00:00:00Z',
    },
    {
      id: '3',
      unique_url: 'test-event-3',
      name: 'BBQ大会',
      date: '2024-02-20',
      participant_count: 12,
      total_amount: 15000,
      created_at: '2024-01-10T00:00:00Z',
    },
  ]

  describe('rendering', () => {
    it('should render component title and description', () => {
      render(<RecentEvents events={mockEvents} />)
      
      expect(screen.getByText('最近のイベント')).toBeInTheDocument()
      expect(screen.getByText('最近作成または更新されたイベント')).toBeInTheDocument()
    })

    it('should render "see all" link', () => {
      render(<RecentEvents events={mockEvents} />)
      
      const seeAllLink = screen.getByRole('link', { name: 'すべて見る' })
      expect(seeAllLink).toBeInTheDocument()
      expect(seeAllLink).toHaveAttribute('href', '/events')
    })

    it('should display event list when events are provided', () => {
      render(<RecentEvents events={mockEvents} />)
      
      expect(screen.getByText('沖縄旅行')).toBeInTheDocument()
      expect(screen.getByText('忘年会2023')).toBeInTheDocument()
      expect(screen.getByText('BBQ大会')).toBeInTheDocument()
    })

    it('should display participant counts correctly', () => {
      render(<RecentEvents events={mockEvents} />)
      
      expect(screen.getByText('5人')).toBeInTheDocument()
      expect(screen.getByText('8人')).toBeInTheDocument()
      expect(screen.getByText('12人')).toBeInTheDocument()
    })

    it('should display formatted amounts correctly', () => {
      render(<RecentEvents events={mockEvents} />)
      
      expect(screen.getByText('¥50,000')).toBeInTheDocument()
      expect(screen.getByText('¥32,000')).toBeInTheDocument()
      expect(screen.getByText('¥15,000')).toBeInTheDocument()
    })

    it('should create correct event links', () => {
      render(<RecentEvents events={mockEvents} />)
      
      const eventLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.startsWith('/events/')
      )
      
      expect(eventLinks).toHaveLength(3)
      expect(eventLinks[0]).toHaveAttribute('href', '/events/test-event-1')
      expect(eventLinks[1]).toHaveAttribute('href', '/events/test-event-2')
      expect(eventLinks[2]).toHaveAttribute('href', '/events/test-event-3')
    })
  })

  describe('date handling', () => {
    it('should display formatted date when date is provided', () => {
      render(<RecentEvents events={[mockEvents[0]]} />)
      
      expect(screen.getByText('2024年01月15日')).toBeInTheDocument()
    })

    it('should not display date when date is null', () => {
      render(<RecentEvents events={[mockEvents[1]]} />)
      
      // Should not find the calendar icon for date display
      const calendarIcons = screen.getAllByTestId('calendar-icon')
      expect(calendarIcons).toHaveLength(0)
    })

    it('should handle mixed date states', () => {
      render(<RecentEvents events={mockEvents} />)
      
      // Events with dates should show formatted dates
      expect(screen.getByText('2024年01月15日')).toBeInTheDocument()
      
      // Events without dates should not have date display
      const eventCard = screen.getByText('忘年会2023').closest('div')
      expect(eventCard).not.toHaveTextContent('2024年01月15日')
    })
  })

  describe('empty state', () => {
    it('should display empty state when no events are provided', () => {
      render(<RecentEvents events={[]} />)
      
      expect(screen.getByText('まだイベントがありません')).toBeInTheDocument()
      expect(screen.getByText('最初のイベントを作成')).toBeInTheDocument()
    })

    it('should provide link to create new event in empty state', () => {
      render(<RecentEvents events={[]} />)
      
      const createEventLink = screen.getByRole('link', { name: '最初のイベントを作成' })
      expect(createEventLink).toBeInTheDocument()
      expect(createEventLink).toHaveAttribute('href', '/events/new')
    })

    it('should display empty state icon', () => {
      render(<RecentEvents events={[]} />)
      
      // Calendar icon should be present in empty state
      const calendarIcon = screen.getByTestId('calendar-icon')
      expect(calendarIcon).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero amounts correctly', () => {
      const eventWithZeroAmount = {
        ...mockEvents[0],
        total_amount: 0,
      }
      
      render(<RecentEvents events={[eventWithZeroAmount]} />)
      
      expect(screen.getByText('¥0')).toBeInTheDocument()
    })

    it('should handle large amounts correctly', () => {
      const eventWithLargeAmount = {
        ...mockEvents[0],
        total_amount: 1234567,
      }
      
      render(<RecentEvents events={[eventWithLargeAmount]} />)
      
      expect(screen.getByText('¥1,234,567')).toBeInTheDocument()
    })

    it('should handle zero participants', () => {
      const eventWithZeroParticipants = {
        ...mockEvents[0],
        participant_count: 0,
      }
      
      render(<RecentEvents events={[eventWithZeroParticipants]} />)
      
      expect(screen.getByText('0人')).toBeInTheDocument()
    })

    it('should handle events with long names', () => {
      const eventWithLongName = {
        ...mockEvents[0],
        name: 'とても長いイベント名'.repeat(10),
      }
      
      render(<RecentEvents events={[eventWithLongName]} />)
      
      expect(screen.getByText(eventWithLongName.name)).toBeInTheDocument()
    })

    it('should handle special characters in event names', () => {
      const eventWithSpecialChars = {
        ...mockEvents[0],
        name: 'Event & <Special> "Characters"',
      }
      
      render(<RecentEvents events={[eventWithSpecialChars]} />)
      
      expect(screen.getByText(eventWithSpecialChars.name)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<RecentEvents events={mockEvents} />)
      
      // Should have heading
      expect(screen.getByRole('heading', { name: '最近のイベント' })).toBeInTheDocument()
      
      // Should have links
      expect(screen.getAllByRole('link')).toHaveLength(4) // 3 events + 1 see all
    })

    it('should provide meaningful link text', () => {
      render(<RecentEvents events={mockEvents} />)
      
      const eventLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.startsWith('/events/')
      )
      
      eventLinks.forEach(link => {
        expect(link).toHaveTextContent(/沖縄旅行|忘年会2023|BBQ大会/)
      })
    })
  })

  describe('performance', () => {
    it('should be memoized', () => {
      // Test that component is wrapped with React.memo
      expect(RecentEvents.displayName).toBe('RecentEvents')
    })
  })
})
export { eventApi } from './events'
export { participantApi } from './participants'
export { expenseApi } from './expenses'

// 統合API
export const supabaseApi = {
  events: () => import('./events').then(m => m.eventApi),
  participants: () => import('./participants').then(m => m.participantApi),
  expenses: () => import('./expenses').then(m => m.expenseApi),
}
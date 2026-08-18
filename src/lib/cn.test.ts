import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('concatena clases y descarta valores falsos', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })

  it('deja ganar a la última clase en conflicto', () => {
    // Sin twMerge esto devolvía "w-full w-auto" y el CSS aplicaba w-full,
    // porque Tailwind declara .w-auto antes que .w-full en la hoja de estilos.
    expect(cn('w-full', 'w-auto')).toBe('w-auto')
    expect(cn('px-3 py-2', 'px-8')).toBe('py-2 px-8')
  })

  it('no toca clases que no compiten entre sí', () => {
    expect(cn('rounded-lg text-sm', 'shadow-sm')).toBe('rounded-lg text-sm shadow-sm')
  })
})

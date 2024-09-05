export interface ChatMessage {
    content: string
    role: ChatRole
    transactionHash?: string
}

export interface Persona {
    id?: string
    role: ChatRole
    avatar?: string
    name?: string
    prompt?: string
    key?: string
    isDefault?: boolean
}

export interface Chat {
    id: string
    persona?: Persona
    messages?: ChatMessage[]
    chatId?: number
}

export type ChatRole = 'assistant' | 'user' | 'system'
import { useState } from 'react'
import { client } from '../client/client.gen'
import { config } from '../config'

const API_TOKEN_STORAGE_KEY = 'api_token'

const configureClient = (token: string) => {
  client.setConfig({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export function useApiToken() {
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem(API_TOKEN_STORAGE_KEY)
    
    if (storedToken) {
      configureClient(storedToken) // 复用
    }
    
    return storedToken
  })

  const saveToken = (newToken: string) => {
    localStorage.setItem(API_TOKEN_STORAGE_KEY, newToken)
    configureClient(newToken) // 复用
    setToken(newToken)
  }

  return {
    token,
    saveToken,
    hasToken: !!token
  }
}
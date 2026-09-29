import { isBrowser, readEnv } from "./env"

const API_BASE = readEnv("VITE_API_URL") || "http://localhost:8080"

function networkError(path: string, cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause)
  return new Error(
    `Cannot reach API ${API_BASE}${path} (${detail || "network error"}). ` +
      `Is the Go API running (task dev in C:\\Users\\FEMI\\eazyrent)?`,
  )
}

export type User = {
  id: string
  email: string
  phone: string
  full_name: string
  avatar_url: string | null
  email_verified: boolean
  created_at: string
  updated_at: string
}

export type AuthTokens = {
  access_token: string
  refresh_token: string
}

export type ListingStatus = "avaiable" | "rented" | "inative"

export type Listing = {
  id: string
  landlord_id: string
  title: string
  description: string
  price: string
  rooms: number | null
  furnished: boolean
  status: ListingStatus
  address: string
  latitude: number
  longitude: number
  cover_image: string | null
  favorite_count: number
  created_at: string
  updated_at: string
}

export type Media = {
  id: string
  listing_id: string
  url: string
  type: "image" | "video"
  order: number
  created_at: string
}

export type ListingDetail = {
  listing: Listing
  media: Media[]
  landlord_phone: string | null
  landlord_name: string | null
}

export type PageResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export type ListingFilters = {
  page?: number
  limit?: number
  status?: string
  furnished?: boolean
  rooms?: number
  minRooms?: number
  minPrice?: number
  maxPrice?: number
  search?: string
}

function getAccessToken(): string | null {
  if (!isBrowser) return null
  return localStorage.getItem("easyrent_access")
}
function getRefreshToken(): string | null {
  if (!isBrowser) return null
  return localStorage.getItem("easyrent_refresh")
}

export function setTokens(t: AuthTokens) {
  localStorage.setItem("easyrent_access", t.access_token)
  localStorage.setItem("easyrent_refresh", t.refresh_token)
}
export function clearTokens() {
  localStorage.removeItem("easyrent_access")
  localStorage.removeItem("easyrent_refresh")
}
export function getStoredTokens() {
  return { access: getAccessToken(), refresh: getRefreshToken() }
}

type ApiError = Error & { status?: number }

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    // SAFETY: err is a locally constructed Error; attaching the HTTP status
    // only adds optional metadata without changing the Error contract.
    const err = new Error(body.error || body.message || `Request failed ${res.status}`) as ApiError
    err.status = res.status
    throw err
  }
  if (res.status === 204) {
    // SAFETY: a 204 response carries no body, and every 204 call site uses
    // T = void, so undefined is the only inhabitant of the response contract.
    return undefined as T
  }
  // SAFETY: each endpoint's Go handler responds with JSON matching the
  // call-site T; a contract mismatch surfaces as a shape error at use site.
  return res.json() as Promise<T>
}

async function refreshIfNeeded(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) {
    clearTokens()
    return null
  }
  // SAFETY: POST /auth/refresh responds with AuthTokens per the Go API contract.
  const tokens = (await res.json()) as AuthTokens
  setTokens(tokens)
  return tokens.access_token
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json")
  const token = getAccessToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch (cause) {
    throw networkError(path, cause)
  }
  if (res.status === 401 && retry && getRefreshToken()) {
    const newToken = await refreshIfNeeded()
    if (newToken) {
      const retryHeaders = new Headers(init.headers)
      if (!retryHeaders.has("Content-Type") && init.body) retryHeaders.set("Content-Type", "application/json")
      retryHeaders.set("Authorization", `Bearer ${newToken}`)
      let retryRes: Response
      try {
        retryRes = await fetch(`${API_BASE}${path}`, {
          ...init,
          headers: retryHeaders,
        })
      } catch (cause) {
        throw networkError(path, cause)
      }
      return handleResponse<T>(retryRes)
    }
  }
  return handleResponse<T>(res)
}

// Public fetches (no auth header)
export async function publicFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json")
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch (cause) {
    throw networkError(path, cause)
  }
  return handleResponse<T>(res)
}

/* Auth */
export const authApi = {
  signup: (body: { email: string; password: string; phone: string; full_name: string }) =>
    publicFetch<AuthTokens>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  signin: (body: { email: string; password: string }) =>
    publicFetch<AuthTokens>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verify: (token: string) => publicFetch<{ status: string }>(`/auth/verify?token=${encodeURIComponent(token)}`),
  forgot: (email: string) =>
    publicFetch<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  reset: (token: string, new_password: string) =>
    publicFetch<{ status: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
  me: () => apiFetch<User>("/me"),
  updateAvatar: (avatar_url: string) =>
    apiFetch<User>("/me/avatar", {
      method: "PUT",
      body: JSON.stringify({ avatar_url }),
    }),
  signout: () => {
    const rt = getRefreshToken()
    if (!rt) return Promise.resolve()
    return apiFetch<void>("/auth/signout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: rt }),
    }).finally(clearTokens)
  },
}

/* Listings */
export const listingsApi = {
  list: (filters: ListingFilters = {}) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null || v === "") continue
      q.set(k, String(v))
    }
    const qs = q.toString()
    return publicFetch<PageResponse<Listing>>(`/listings${qs ? `?${qs}` : ""}`)
  },
  my: (page = 1, limit = 20) => apiFetch<PageResponse<Listing>>(`/listings/my?page=${page}&limit=${limit}`),
  get: (id: string) => publicFetch<ListingDetail>(`/listings/${id}`),
  create: (body: {
    title: string
    description: string
    price: string
    rooms: number
    furnished: boolean
    latitude: number
    longitude: number
    address: string
  }) =>
    apiFetch<Listing>("/listings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (
    id: string,
    body: Partial<{
      title: string
      description: string
      price: string
      rooms: number
      furnished: boolean
      latitude: number
      longitude: number
      address: string
    }>,
  ) =>
    apiFetch<Listing>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => apiFetch<void>(`/listings/${id}`, { method: "DELETE" }),
  updateStatus: (id: string, status: string) =>
    apiFetch<Listing>(`/listings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  addMedia: (id: string, body: { url: string; type: string; order: number }) =>
    apiFetch<Media>(`/listings/${id}/media`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
}

export const favoritesApi = {
  list: (page = 1, limit = 20) => apiFetch<PageResponse<Listing>>(`/favorites?page=${page}&limit=${limit}`),
  add: (id: string) => apiFetch<{ status: string }>(`/favorites/${id}`, { method: "POST" }),
  remove: (id: string) => apiFetch<void>(`/favorites/${id}`, { method: "DELETE" }),
}

export function formatPrice(price: string): string
export function formatPrice(price: number): string
export function formatPrice(price: string | number): string {
  const n = Number(price)
  if (Number.isNaN(n)) return String(price)
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n)
}

export { API_BASE }

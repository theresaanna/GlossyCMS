export interface Tweet {
  id: string
  text: string
  created_at: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  author: {
    id: string
    name: string
    username: string
    profile_image_url?: string
  }
}

interface TwitterApiTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
}

interface TwitterApiUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

interface TwitterApiResponse {
  data?: TwitterApiTweet[]
  includes?: {
    users?: TwitterApiUser[]
  }
  errors?: Array<{ message: string; title: string }>
  meta?: {
    result_count: number
  }
}

export interface FetchTweetsResult {
  tweets: Tweet[]
  error?: string
}

export async function fetchTweets(
  bearerToken: string,
  username: string,
  count: number,
): Promise<FetchTweetsResult> {
  const query = encodeURIComponent(`from:${username} -is:retweet -is:reply`)
  const params = new URLSearchParams({
    query,
    max_results: String(Math.max(10, count)),
    'tweet.fields': 'created_at,public_metrics,author_id',
    expansions: 'author_id',
    'user.fields': 'name,username,profile_image_url',
  })

  const url = `https://api.x.com/2/tweets/search/recent?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      next: { revalidate: 300 },
    })
  } catch (err) {
    return { tweets: [], error: 'Failed to connect to Twitter/X API.' }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { tweets: [], error: 'Invalid Twitter/X Bearer Token.' }
    }
    if (response.status === 429) {
      return { tweets: [], error: 'Twitter/X API rate limit exceeded. Please try again later.' }
    }
    return { tweets: [], error: `Twitter/X API error (${response.status}).` }
  }

  const data: TwitterApiResponse = await response.json()

  if (data.errors?.length) {
    return { tweets: [], error: data.errors[0].message }
  }

  if (!data.data?.length) {
    return { tweets: [], error: undefined }
  }

  const usersMap = new Map<string, TwitterApiUser>()
  if (data.includes?.users) {
    for (const user of data.includes.users) {
      usersMap.set(user.id, user)
    }
  }

  const tweets: Tweet[] = data.data.slice(0, count).map((tweet) => {
    const author = usersMap.get(tweet.author_id)
    return {
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      public_metrics: tweet.public_metrics,
      author: author
        ? {
            id: author.id,
            name: author.name,
            username: author.username,
            profile_image_url: author.profile_image_url,
          }
        : {
            id: tweet.author_id,
            name: username,
            username,
          },
    }
  })

  return { tweets }
}

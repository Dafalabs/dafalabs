import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str, limit: int, window: int) -> bool:
        now = time.time()
        hits = self._buckets[key]

        while hits and now - hits[0] > window:
            hits.popleft()

        if len(hits) >= limit:
            return True

        hits.append(now)
        return False

    def reset(self) -> None:
        self._buckets.clear()


contact_limiter = RateLimiter()
auto_reply_limiter = RateLimiter()
login_limiter = RateLimiter()
tracking_limiter = RateLimiter()


def reset_all() -> None:
    for limiter in (contact_limiter, auto_reply_limiter, login_limiter, tracking_limiter):
        limiter.reset()

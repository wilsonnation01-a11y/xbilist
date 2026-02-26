#!/usr/bin/env python3
"""Automate Facebook Page comment responses using the Graph API.

This tool polls recent page posts, collects comments, and automatically replies
based on keyword rules.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set

import requests
import yaml

GRAPH_BASE = "https://graph.facebook.com/v20.0"


@dataclass
class Rule:
    keywords: List[str]
    reply: str

    def matches(self, text: str) -> bool:
        lowered = text.lower()
        return any(keyword.lower() in lowered for keyword in self.keywords)


class FacebookCommentResponder:
    def __init__(
        self,
        page_id: str,
        access_token: str,
        rules: List[Rule],
        state_path: Path,
        dry_run: bool = False,
    ) -> None:
        self.page_id = page_id
        self.access_token = access_token
        self.rules = rules
        self.state_path = state_path
        self.dry_run = dry_run
        self._seen_comment_ids = self._load_state()

    def _load_state(self) -> Set[str]:
        if not self.state_path.exists():
            return set()
        with self.state_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return set(data.get("replied_comment_ids", []))

    def _save_state(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"replied_comment_ids": sorted(self._seen_comment_ids)}
        with self.state_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def _request(self, method: str, path: str, **kwargs):
        url = f"{GRAPH_BASE}/{path.lstrip('/')}"
        params = kwargs.pop("params", {})
        params["access_token"] = self.access_token
        response = requests.request(method, url, params=params, timeout=20, **kwargs)
        response.raise_for_status()
        return response.json()

    def list_recent_posts(self, limit: int = 5) -> Iterable[Dict]:
        result = self._request(
            "GET",
            f"{self.page_id}/posts",
            params={"fields": "id,message,created_time", "limit": limit},
        )
        return result.get("data", [])

    def list_comments(self, post_id: str, limit: int = 100) -> Iterable[Dict]:
        result = self._request(
            "GET",
            f"{post_id}/comments",
            params={"fields": "id,message,from,created_time", "limit": limit},
        )
        return result.get("data", [])

    def choose_reply(self, message: str) -> Optional[str]:
        for rule in self.rules:
            if rule.matches(message):
                return rule.reply
        return None

    def reply_to_comment(self, comment_id: str, message: str) -> None:
        if self.dry_run:
            logging.info("[DRY RUN] Would reply to %s: %s", comment_id, message)
            return
        self._request("POST", f"{comment_id}/comments", data={"message": message})
        logging.info("Replied to comment %s", comment_id)

    def process_once(self, posts_limit: int = 5, comments_limit: int = 50) -> int:
        replies_sent = 0
        for post in self.list_recent_posts(limit=posts_limit):
            post_id = post["id"]
            for comment in self.list_comments(post_id, limit=comments_limit):
                comment_id = comment.get("id")
                message = comment.get("message", "")
                if not comment_id or not message:
                    continue
                if comment_id in self._seen_comment_ids:
                    continue

                reply = self.choose_reply(message)
                if not reply:
                    logging.debug("No rule matched comment %s", comment_id)
                    continue

                self.reply_to_comment(comment_id, reply)
                self._seen_comment_ids.add(comment_id)
                replies_sent += 1

        self._save_state()
        return replies_sent


def load_rules(path: Path) -> List[Rule]:
    with path.open("r", encoding="utf-8") as f:
        payload = yaml.safe_load(f) or {}

    rules = []
    for item in payload.get("rules", []):
        keywords = item.get("keywords", [])
        reply = item.get("reply", "").strip()
        if keywords and reply:
            rules.append(Rule(keywords=keywords, reply=reply))
    return rules


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Facebook page comment auto responder")
    parser.add_argument("--rules", default="rules.example.yml", help="Path to rule file")
    parser.add_argument("--state", default=".state/replied_comments.json", help="Path to state file")
    parser.add_argument("--interval", type=int, default=0, help="Loop interval in seconds (0 = run once)")
    parser.add_argument("--posts-limit", type=int, default=5)
    parser.add_argument("--comments-limit", type=int, default=50)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args()


def build_responder(args: argparse.Namespace) -> FacebookCommentResponder:
    page_id = os.getenv("FB_PAGE_ID", "")
    access_token = os.getenv("FB_PAGE_ACCESS_TOKEN", "")
    if not page_id or not access_token:
        raise SystemExit("FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN environment variables are required")

    rules = load_rules(Path(args.rules))
    if not rules:
        raise SystemExit("No valid rules found. Add entries under 'rules' in your yaml file.")

    return FacebookCommentResponder(
        page_id=page_id,
        access_token=access_token,
        rules=rules,
        state_path=Path(args.state),
        dry_run=args.dry_run,
    )


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(message)s",
    )
    responder = build_responder(args)

    if args.interval <= 0:
        sent = responder.process_once(posts_limit=args.posts_limit, comments_limit=args.comments_limit)
        logging.info("Done. Replies sent: %s", sent)
        return

    logging.info("Running in loop mode. Interval: %s seconds", args.interval)
    while True:
        try:
            sent = responder.process_once(posts_limit=args.posts_limit, comments_limit=args.comments_limit)
            logging.info("Iteration complete. Replies sent: %s", sent)
        except requests.HTTPError as exc:
            logging.error("Graph API error: %s", exc)
        except Exception as exc:  # pragma: no cover
            logging.exception("Unexpected error: %s", exc)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()

# ai-service/services/llm_service.py
"""
LLM Service Abstraction Layer
Supports: Gemini, OpenAI, Anthropic
Schools can plug in their own API keys.
"""
import os
import httpx
from typing import Optional
import json

class LLMService:
    def __init__(self, provider: str = None, api_key: str = None, model_name: str = None):
        self.provider = provider or os.getenv("DEFAULT_AI_PROVIDER", "gemini")
        self.api_key = api_key or os.getenv("DEFAULT_AI_API_KEY", "")
        self.model_name = model_name or os.getenv("MODEL_NAME", "gemini-2.5-flash")


    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 2000, json_mode: bool = False) -> str:
        if self.provider == "gemini":
            return await self._gemini(prompt, system_prompt, max_tokens, json_mode)
        elif self.provider == "openai":
            return await self._openai(prompt, system_prompt, max_tokens, json_mode)
        elif self.provider == "anthropic":
            return await self._anthropic(prompt, system_prompt, max_tokens)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    async def _gemini(self, prompt: str, system_prompt: str, max_tokens: int, json_mode: bool) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"System: {system_prompt}\n\nUser: {prompt}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7,
            }
        }
        
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _openai(self, prompt: str, system_prompt: str, max_tokens: int, json_mode: bool) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {self.api_key}"})
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _anthropic(self, prompt: str, system_prompt: str, max_tokens: int) -> str:
        url = "https://api.anthropic.com/v1/messages"
        payload = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers={
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            })
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]


# Convenience function
async def get_llm_response(
    prompt: str,
    system_prompt: str = "",
    max_tokens: int = 2000,
    json_mode: bool = False,
    provider: str = None,
    api_key: str = None
) -> str:
    service = LLMService(provider=provider, api_key=api_key)
    return await service.generate(prompt, system_prompt, max_tokens, json_mode)

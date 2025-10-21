import httpx
import json
from typing import Dict, Optional
from config import get_settings

settings = get_settings()

class WebScraper:
    """Scrapes EVERYTHING about a person using Google search"""
    
    def __init__(self):
        self.serper_key = settings.serper_api_key
    
    async def search_person(self, name: str, handles: Dict[str, str]) -> Dict:
        """Search for person across the ENTIRE web - no limits!"""
        results = {
            "google_general": [],
            "instagram": [],
            "twitter": [],
            "linkedin": [],
            "facebook": [],
            "github": [],
            "tiktok": [],
            "reddit": [],
            "youtube": [],
            "all_findings": []
        }
        
        if not self.serper_key:
            return results
        
        # Search EVERYTHING with Google via Serper
        # Serper gives us access to ALL of Google's results!
        
        # 1. General search about the person
        general = await self._comprehensive_google_search(name, handles)
        results["google_general"] = general
        
        # 2. Platform-specific searches
        for platform, handle in handles.items():
            if handle:
                platform_results = await self._search_platform(platform, handle, name)
                results[platform] = platform_results
        
        # 3. Deep search - try username variations
        if handles:
            # Get most common handle (likely their username everywhere)
            main_handle = next(iter(handles.values()))
            deep_results = await self._deep_search(main_handle, name)
            results["all_findings"] = deep_results
        
        return results
    
    async def _comprehensive_google_search(self, name: str, handles: Dict) -> list:
        """COMPREHENSIVE Google search - finds EVERYTHING"""
        all_results = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Multiple searches to find everything
                searches = [
                    f'"{name}"',  # Exact name
                    f'{name} social media',
                    f'{name} profile',
                ]
                
                # Add all handles to searches
                for platform, handle in handles.items():
                    if handle:
                        searches.append(f'"{handle}"')
                        searches.append(f'{handle} {platform}')
                
                # Run all searches
                for query in searches[:10]:  # Top 10 searches
                    response = await client.post(
                        "https://google.serper.dev/search",
                        headers={
                            "X-API-KEY": self.serper_key,
                            "Content-Type": "application/json"
                        },
                        json={"q": query, "num": 10}  # 10 results per search
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        all_results.extend(data.get("organic", []))
                        
                        # Also get knowledge graph if available
                        if "knowledgeGraph" in data:
                            all_results.append({
                                "type": "knowledge_graph",
                                "data": data["knowledgeGraph"]
                            })
        except Exception as e:
            print(f"Comprehensive search error: {e}")
        
        return all_results
    
    async def _search_platform(self, platform: str, handle: str, name: str) -> list:
        """Search specific platform using Google"""
        results = []
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Platform-specific Google searches
                queries = {
                    "instagram": f'site:instagram.com "{handle}"',
                    "twitter": f'site:twitter.com "{handle}" OR site:x.com "{handle}"',
                    "linkedin": f'site:linkedin.com/in "{handle}" OR "{name}"',
                    "facebook": f'site:facebook.com "{handle}" OR "{name}"',
                    "github": f'site:github.com "{handle}"',
                    "tiktok": f'site:tiktok.com "@{handle}"',
                    "reddit": f'site:reddit.com/user "{handle}"',
                    "youtube": f'site:youtube.com "{handle}" OR "{name}"'
                }
                
                query = queries.get(platform, f'"{handle}" {platform}')
                
                response = await client.post(
                    "https://google.serper.dev/search",
                    headers={
                        "X-API-KEY": self.serper_key,
                        "Content-Type": "application/json"
                    },
                    json={"q": query, "num": 5}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("organic", [])
        except Exception as e:
            print(f"{platform} search error: {e}")
        
        return results
    
    async def _deep_search(self, username: str, name: str) -> list:
        """Deep search - find EVERYTHING about this person"""
        findings = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Cast a wide net - search everything
                deep_queries = [
                    f'"{username}"',  # Exact username
                    f'{username} profile',
                    f'{username} posts',
                    f'{username} photos',
                    f'{username} about',
                    f'{name} "{username}"',  # Name + username
                    f'{username} -site:pinterest.com',  # Exclude spam sites
                ]
                
                for query in deep_queries:
                    response = await client.post(
                        "https://google.serper.dev/search",
                        headers={
                            "X-API-KEY": self.serper_key,
                            "Content-Type": "application/json"
                        },
                        json={"q": query, "num": 10}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        findings.extend(data.get("organic", []))
        except Exception as e:
            print(f"Deep search error: {e}")
        
        return findings
    
    async def _search_instagram(self, handle: str) -> Dict:
        """Get public Instagram info"""
        # Note: Instagram's API requires auth. This is simplified.
        # In production, use official API or services like Apify
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try to get public profile page
                url = f"https://www.instagram.com/{handle}/?__a=1"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    user = data.get("graphql", {}).get("user", {})
                    
                    return {
                        "username": user.get("username"),
                        "full_name": user.get("full_name"),
                        "bio": user.get("biography"),
                        "followers": user.get("edge_followed_by", {}).get("count"),
                        "following": user.get("edge_follow", {}).get("count"),
                        "posts_count": user.get("edge_owner_to_timeline_media", {}).get("count"),
                        "is_verified": user.get("is_verified"),
                        "profile_pic": user.get("profile_pic_url_hd")
                    }
        except Exception as e:
            print(f"Instagram scrape error: {e}")
        
        return {"error": "Could not fetch Instagram data"}
    
    async def _search_linkedin(self, handle: str) -> Dict:
        """Get public LinkedIn info"""
        # LinkedIn is tricky - requires login usually
        # This is a placeholder - in production use official API or services
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://www.linkedin.com/in/{handle}"
                response = await client.get(url)
                
                # Parse HTML for public info (very basic)
                # In production, use proper scraping service
                return {
                    "url": url,
                    "profile_exists": response.status_code == 200
                }
        except Exception as e:
            print(f"LinkedIn scrape error: {e}")
        
        return {}
    
    async def _search_twitter(self, handle: str) -> Dict:
        """Get public Twitter/X info"""
        # Twitter requires API access now
        # This is placeholder
        try:
            return {
                "handle": handle,
                "url": f"https://twitter.com/{handle}",
                "note": "Twitter API requires authentication"
            }
        except Exception as e:
            print(f"Twitter scrape error: {e}")
        
        return {}

web_scraper = WebScraper()


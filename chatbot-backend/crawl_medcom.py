
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

start_url = "https://medcomfhir.dk/ig/homecareobservation/"

response = requests.get(start_url, timeout=20)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")

print(f"Startside: {response.url}")
print(f"Statuskode: {response.status_code}")

# Find links på siden
links = set()

for link in soup.find_all("a", href=True):
    absolute_url = urljoin(start_url, link["href"])
    parsed_url = urlparse(absolute_url)

    # Behold kun links til samme website og samme dokumentationsområde
    if (
        parsed_url.netloc == urlparse(start_url).netloc
        and absolute_url.startswith(start_url)
        and parsed_url.scheme in ("http", "https")
    ):
        links.add(absolute_url.split("#")[0])

print(f"\nAntal unikke links fundet: {len(links)}")

for link in sorted(links):
    print(link)


import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

start_url = "https://medcomfhir.dk/ig/homecareobservation/"

response = requests.get(start_url, timeout=20)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")

links = set()

for link in soup.find_all("a", href=True):
    absolute_url = urljoin(start_url, link["href"])
    parsed_url = urlparse(absolute_url)

    if (
        parsed_url.netloc == urlparse(start_url).netloc
        and absolute_url.startswith(start_url)
        and parsed_url.scheme in ("http", "https")
    ):
        links.add(absolute_url.split("#")[0])

# Inkludér startsiden
links.add(start_url)

print(f"Antal unikke links: {len(links)}")

with open("medcom_fhir_ig.txt", "w", encoding="utf-8") as file:
    for url in sorted(links):
        try:
            page_response = requests.get(url, timeout=20)
            page_response.raise_for_status()

            page_soup = BeautifulSoup(
                page_response.text,
                "html.parser"
            )

            # Fjern elementer, der ikke er dokumentationstekst
            for element in page_soup(
                ["script", "style", "nav", "footer", "header"]
            ):
                element.decompose()

            title = page_soup.title.get_text(
                strip=True
            ) if page_soup.title else url

            text = page_soup.get_text(
                separator=" ",
                strip=True
            )

            file.write(f"\n\nURL: {url}\n")
            file.write(f"Titel: {title}\n")
            file.write(text)

            print(f"Hentet: {url}")

        except requests.RequestException as error:
            print(f"Kunne ikke hente {url}: {error}")

print("\nDokumentation gemt i medcom_fhir_ig.txt")

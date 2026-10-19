"""Compare repeated construction from Python mappings and shared native catalogs."""

import argparse
import timeit

from intl import Intl, MessageCatalog


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--number", type=int, default=200)
    parser.add_argument("--repeat", type=int, default=3)
    args = parser.parse_args()
    print("locales  messages  mapping µs  shared µs  speedup")
    for size in (2, 51, 200):
        locales = ["en-US", "fr"] + [
            f"en-{region:03}" for region in range(1, size - 1)
        ]
        messages = {
            locale: {
                f"message-{key}": f"{locale} message {key}: {{name}}"
                for key in range(296)
            }
            for locale in locales
        }
        catalog = MessageCatalog(messages)
        timings = []
        for source in (messages, catalog):
            timings.append(
                min(
                    timeit.repeat(
                        lambda: Intl(["fr-CA"], "en-US", source),
                        number=args.number,
                        repeat=args.repeat,
                    )
                ) * 1_000_000 / args.number
            )
        mapping, shared = timings
        print(f"{size:7}  {296:8}  {mapping:10.2f}  {shared:9.2f}  {mapping / shared:7.1f}x")


if __name__ == "__main__":
    main()

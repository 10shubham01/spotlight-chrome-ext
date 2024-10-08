import "./App.css";
import React, { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./comonents/command";
import { BookmarkIcon, GlobeIcon } from "@radix-ui/react-icons";

// Defining types for chrome API interactions
interface Tab {
  title: string;
  url: string;
  favIconUrl?: string;
  windowId: number;
}

interface Bookmark {
  title: string;
  url: string;
  favIconUrl?: string;
}

interface HistorySuggestion {
  title: string;
  url: string;
}

const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [historySuggestions, setHistorySuggestions] = useState<
    HistorySuggestion[]
  >([]);
  const [activeTabs, setActiveTabs] = useState<Tab[]>([]);
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<Tab[]>([]);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const getFavicon = (url: string) =>
    `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

  const fetchBookmarks = () => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      const extractBookmarks = (
        nodes: chrome.bookmarks.BookmarkTreeNode[]
      ): Bookmark[] => {
        let bookmarksList: Bookmark[] = [];
        nodes.forEach((node) => {
          if (node.url) {
            bookmarksList.push({
              title: node.title,
              url: node.url,
              favIconUrl: getFavicon(node.url),
            });
          }
          if (node.children) {
            bookmarksList = bookmarksList.concat(
              extractBookmarks(node.children)
            );
          }
        });
        return bookmarksList;
      };

      setBookmarks(extractBookmarks(bookmarkTreeNodes));
    });
  };

  const fetchActiveTabs = async (): Promise<Tab[]> => {
    return new Promise((resolve) => {
      chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
        setCurrentWindowId(currentWindow?.id ?? null);
        chrome.tabs.query({}, (tabs) => {
          const allTabs = tabs
            .filter((tab) => tab.windowId === currentWindow?.id)
            .map((tab) => ({
              title: tab.title ?? "No title",
              url: tab.url ?? "No URL",
              favIconUrl: tab.favIconUrl,
              windowId: tab.windowId,
            }));
          resolve(allTabs);
        });
      });
    });
  };

  const fetchRecentlyClosedTabs = () => {
    chrome.sessions.getRecentlyClosed((sessions) => {
      const closedTabs = sessions
        .filter((session) => session.tab)
        .map((session) => {
          const tab = session.tab!;
          return {
            title: tab.title ?? "No title",
            url: tab.url ?? "No URL",
            favIconUrl: tab.favIconUrl,
            windowId: -1, // Closed tabs don’t have a windowId
          };
        });
      setRecentlyClosedTabs(closedTabs);
    });
  };

  useEffect(() => {
    const updateTabsAndCommands = async () => {
      const tabs = await fetchActiveTabs();
      const uniqueTabs = Array.from(
        new Map(tabs.map((tab) => [tab.url, tab])).values()
      );
      setActiveTabs(uniqueTabs);

      if (query) {
        chrome.history.search({ text: query, maxResults: 1000 }, (results) => {
          const uniqueHistory = Array.from(
            new Map(
              results
                .filter((item) => item.title && item.url)
                .map((item) => [item.title, item])
            ).values()
          );
          setHistorySuggestions(uniqueHistory as HistorySuggestion[]);
        });
      } else {
        chrome.history.search({ text: "", maxResults: 5 }, (results) => {
          const uniqueHistory = Array.from(
            new Map(
              results
                .filter((item) => item.title && item.url)
                .map((item) => [item.title, item])
            ).values()
          );
          setHistorySuggestions(uniqueHistory as HistorySuggestion[]);
        });
      }

      fetchBookmarks();
      fetchRecentlyClosedTabs();
    };

    updateTabsAndCommands();
  }, [query]);

  const handleSuggestionClick = (url: string) => {
    chrome.tabs.query({}, (tabs) => {
      const matchingTab = tabs.find((tab) => tab.url === url);
      if (matchingTab) {
        chrome.tabs.update(matchingTab.id!, { active: true });
      } else {
        chrome.tabs.create({ url });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && historySuggestions.length === 0) {
      chrome.tabs.create({
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      });
      setQuery("");
    }
  };

  return (
    <div className="w-[500px] !bg-transparent flex justify-start items-start">
      <CommandDialog open={true}>
        <CommandInput
          placeholder="Spotlight Search"
          onValueChange={setQuery}
          onKeyDown={handleKeyDown}
        />
        <CommandList>
          <CommandEmpty>
            Hit Enter <kbd>↵</kbd> to search on Google.
          </CommandEmpty>

          <CommandGroup heading="Current Window Tabs">
            {activeTabs
              .filter((tab) => tab.windowId === currentWindowId)
              .map((tab) => (
                <CommandItem
                  key={tab.url}
                  value={tab.url}
                  onSelect={() => handleSuggestionClick(tab.url)}
                >
                  {tab.favIconUrl ? (
                    <img
                      src={tab.favIconUrl}
                      alt="Tab Icon"
                      className="inline-block w-4 h-4 mr-2"
                    />
                  ) : (
                    <GlobeIcon className="inline-block w-4 h-4 mr-2" />
                  )}
                  {tab.title}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />

          <CommandGroup heading="Recently Closed Tabs">
            {recentlyClosedTabs.map((tab) => (
              <CommandItem
                key={tab.url}
                onSelect={() => handleSuggestionClick(tab.url)}
              >
                {tab.favIconUrl ? (
                  <img
                    src={tab.favIconUrl}
                    alt="Closed Tab Icon"
                    className="inline-block w-4 h-4 mr-2"
                  />
                ) : (
                  <GlobeIcon className="inline-block w-4 h-4 mr-2" />
                )}
                {tab.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />

          <CommandGroup heading="Bookmarks">
            {bookmarks.map((bookmark) => (
              <CommandItem
                key={bookmark.url}
                onSelect={() => handleSuggestionClick(bookmark.url)}
              >
                {bookmark.favIconUrl ? (
                  <img
                    src={bookmark.favIconUrl}
                    alt="Bookmark Icon"
                    className="inline-block w-4 h-4 mr-2"
                  />
                ) : (
                  <BookmarkIcon className="inline-block w-4 h-4 mr-2" />
                )}
                {bookmark.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />

          <CommandGroup heading="History Suggestions">
            {historySuggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.url}
                onSelect={() => handleSuggestionClick(suggestion.url)}
              >
                {getFavicon(suggestion.url) ? (
                  <img
                    src={getFavicon(suggestion.url)}
                    alt="History Suggestion Icon"
                    className="inline-block w-4 h-4 mr-2"
                  />
                ) : (
                  <GlobeIcon className="inline-block w-4 h-4 mr-2" />
                )}
                {suggestion.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default CommandPalette;

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

import { BookmarkIcon, GlobeIcon } from "@radix-ui/react-icons"; // Importing icons

const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [historySuggestions, setHistorySuggestions] = useState<
    { title: string; url: string }[]
  >([]);
  const [activeTabs, setActiveTabs] = useState<
    { title: string; url: string; favIconUrl?: string; windowId: number }[]
  >([]);

  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<
    { title: string; url: string; favIconUrl?: string }[]
  >([]);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<
    { title: string; url: string; favIconUrl?: string }[]
  >([]);

  // Fetch favicon for a given URL
  const getFavicon = (url: string) => {
    return `https://www.google.com/s2/favicons?domain=${
      new URL(url).hostname
    }&sz=64`; // Google favicon service
  };

  // Function to fetch all bookmarks
  const fetchBookmarks = () => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      const extractBookmarks = (
        nodes: chrome.bookmarks.BookmarkTreeNode[]
      ): { title: string; url: string; favIconUrl?: string }[] => {
        let bookmarksList: {
          title: string;
          url: string;
          favIconUrl?: string;
        }[] = [];
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

      const allBookmarks = extractBookmarks(bookmarkTreeNodes);
      setBookmarks(allBookmarks);
    });
  };

  // Function to fetch active tabs and split by windows
  const fetchActiveTabs = async (): Promise<
    { title: string; url: string; favIconUrl?: string; windowId: number }[]
  > => {
    return new Promise((resolve) => {
      chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
        setCurrentWindowId(currentWindow.id as number); // Store current window ID

        chrome.tabs.query({}, (tabs) => {
          const currentWindowTabs = tabs.filter(
            (tab) => tab.windowId === currentWindow.id
          );
          const allTabs = [
            ...currentWindowTabs.map((tab) => ({
              title: tab.title!,
              url: tab.url!,
              favIconUrl: tab.favIconUrl,
              windowId: tab.windowId,
            })),
          ];

          resolve(allTabs);
        });
      });
    });
  };

  // Fetch recently closed tabs
  const fetchRecentlyClosedTabs = () => {
    chrome.sessions.getRecentlyClosed((sessions) => {
      const closedTabs = sessions
        .filter((session) => session.tab)
        .map((session) => {
          const tab = session.tab!;
          return {
            title: tab.title!,
            url: tab.url!,
            favIconUrl: tab.favIconUrl,
          };
        });
      setRecentlyClosedTabs(closedTabs);
    });
  };

  useEffect(() => {
    const updateTabsAndCommands = async () => {
      const tabs = await fetchActiveTabs();
      const uniqueTabs = Array.from(
        new Map(tabs.map((tab) => [tab.title, tab])).values()
      );
      setActiveTabs(uniqueTabs);

      // Fetch history suggestions based on query
      if (query) {
        chrome.history.search({ text: query, maxResults: 1000 }, (results) => {
          const validResults = results
            .filter((item) => item.title && item.url)
            .map((item) => ({
              title: item.title!,
              url: item.url!,
            }));

          const uniqueHistory = Array.from(
            new Map(validResults.map((item) => [item.title, item])).values()
          );
          setHistorySuggestions(uniqueHistory);
        });
      } else {
        chrome.history.search({ text: "", maxResults: 5 }, (results) => {
          const validResults = results
            .filter((item) => item.title && item.url)
            .map((item) => ({
              title: item.title!,
              url: item.url!,
            }));

          const uniqueHistory = Array.from(
            new Map(validResults.map((item) => [item.title, item])).values()
          );
          setHistorySuggestions(uniqueHistory);
        });
      }

      // Fetch bookmarks
      fetchBookmarks();

      // Fetch recently closed tabs
      fetchRecentlyClosedTabs();
    };

    updateTabsAndCommands();
  }, [query]);

  const handleSuggestionClick = (url: string) => {
    chrome.tabs.query({}, (tabs) => {
      const matchingTab = tabs.find((tab) => tab.url === url);
      if (matchingTab) {
        chrome.tabs.update(matchingTab.id!, { active: true });
        // Update recent tabs
      } else {
        chrome.tabs.create({ url });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (historySuggestions.length === 0) {
        chrome.tabs.create({
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        });
        setQuery("");
      }
    }
  };

  return (
    <div className="w-[500px] !bg-transparent flex justify-start items-start">
      <CommandDialog open={true}>
        <CommandInput
          placeholder="Spotlight Search"
          onValueChange={(e) => setQuery(e)}
          onKeyDown={handleKeyDown}
        />
        <CommandList>
          <CommandEmpty>
            Hit Enter <kbd>↵</kbd> to search on Google.
          </CommandEmpty>

          {/* Active Tabs Section for Current Window */}
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

          {/* Recently Closed Tabs Section */}
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

          {/* Bookmarks Section */}
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

          {/* History Suggestions Section */}
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

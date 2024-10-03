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

const COMMANDS: { name: string; action: () => void }[] = [
  { name: "New Tab", action: () => chrome.tabs.create({}) },
  { name: "New Window", action: () => chrome.windows.create({}) },
  {
    name: "Open History Page",
    action: () => chrome.tabs.create({ url: "chrome://history" }),
  },
  {
    name: "Open Downloads",
    action: () => chrome.tabs.create({ url: "chrome://downloads" }),
  },
  {
    name: "Open Extensions",
    action: () => chrome.tabs.create({ url: "chrome://extensions" }),
  },
  {
    name: "Open Bookmarks",
    action: () => chrome.tabs.create({ url: "chrome://bookmarks" }),
  },
  {
    name: "Add this tab to Bookmarks",
    action: () =>
      chrome.bookmarks.create({
        title: document.title,
        url: window.location.href,
      }),
  },
  {
    name: "Open Settings",
    action: () => chrome.tabs.create({ url: "chrome://settings" }),
  },
  { name: "Reload Tab", action: () => chrome.tabs.reload() },
  {
    name: "New Incognito Window",
    action: () => chrome.windows.create({ incognito: true }),
  },
];

const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [filteredCommands, setFilteredCommands] =
    useState<typeof COMMANDS>(COMMANDS);
  const [historySuggestions, setHistorySuggestions] = useState<
    { title: string; url: string }[]
  >([]);
  const [activeTabs, setActiveTabs] = useState<
    { title: string; url: string; favIconUrl?: string }[]
  >([]);

  useEffect(() => {
    // Fetch all active tabs
    chrome.tabs.query({}, (tabs) => {
      const tabList = tabs.map((tab) => ({
        title: tab.title!,
        url: tab.url!,
        favIconUrl: tab.favIconUrl,
      }));
      setActiveTabs(tabList);
    });

    // Filter commands based on query
    const filtered = COMMANDS.filter((command) =>
      command.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCommands(filtered);

    // Fetch history suggestions if no command matches
    if (query && !filtered.length) {
      chrome.history.search({ text: query, maxResults: 5 }, (results) => {
        const validResults = results
          .filter((item) => item.title && item.url)
          .map((item) => ({ title: item.title!, url: item.url! }));
        setHistorySuggestions(validResults);
      });
    } else {
      setHistorySuggestions([]);
    }
  }, [query]);

  const handleSuggestionClick = (url: string) => {
    chrome.tabs.create({ url });
    setQuery("");
  };

  const handleCommandClick = (action: () => void) => {
    action();
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (filteredCommands.length === 0 && historySuggestions.length === 0) {
        chrome.tabs.create({
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        });
        setQuery("");
      }
    }
  };

  return (
    <div className="w-[500px] min-h-[400px] !bg-transparent flex justify-start items-start">
      <CommandDialog open={true}>
        <CommandInput
          placeholder="Type a command or search..."
          onValueChange={(e) => setQuery(e)}
          onKeyDown={(e) => handleKeyDown(e)}
        />
        <CommandList>
          <CommandEmpty>Press Enter to search</CommandEmpty>

          {/* Active Tabs Section */}
          <CommandGroup heading="Active Tabs">
            {activeTabs.map((tab, idx) => (
              <CommandItem
                key={idx}
                onSelect={() => handleSuggestionClick(tab.url)}
              >
                <img
                  src={tab.favIconUrl}
                  alt="Tab Icon"
                  className="inline-block w-4 h-4 mr-2"
                />
                {tab.title}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Commands Section */}
          <CommandGroup heading="Commands">
            {filteredCommands.map((command, idx) => (
              <CommandItem
                key={idx}
                onSelect={() => handleCommandClick(command.action)}
              >
                {command.name}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* History Suggestions Section */}
          <CommandGroup heading="History Suggestions">
            {historySuggestions.map((suggestion, idx) => (
              <CommandItem
                key={idx}
                onClick={() => handleSuggestionClick(suggestion.url)}
              >
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

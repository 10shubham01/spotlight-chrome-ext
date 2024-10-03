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
  CommandShortcut,
} from "./comonents/command";

import {
  FilePlusIcon,
  CardStackPlusIcon,
  CounterClockwiseClockIcon,
  DownloadIcon,
  DashboardIcon,
  BookmarkIcon,
  ReloadIcon,
  EyeClosedIcon,
  GearIcon,
  GlobeIcon,
} from "@radix-ui/react-icons"; // Importing icons

// Function to detect the user's OS
const getSystemShortcutKey = () => {
  const platform = navigator.platform.toLowerCase();
  return platform.includes("mac") ? "⌘" : "Ctrl";
};

const COMMANDS = [
  {
    name: "New Tab",
    icon: <FilePlusIcon />,
    shortcut: "T",
    action: () => chrome.tabs.create({}),
  },
  {
    name: "New Window",
    icon: <CardStackPlusIcon />,
    shortcut: "N",
    action: () => chrome.windows.create({}),
  },
  {
    name: "History",
    icon: <CounterClockwiseClockIcon />,
    shortcut: "Y",
    action: () => chrome.tabs.create({ url: "chrome://history" }),
  },
  {
    name: "Downloads",
    icon: <DownloadIcon />,
    shortcut: "J",
    action: () => chrome.tabs.create({ url: "chrome://downloads" }),
  },
  {
    name: "Extensions",
    icon: <DashboardIcon />,
    shortcut: "E",
    action: () => chrome.tabs.create({ url: "chrome://extensions" }),
  },
  {
    name: "Bookmarks",
    icon: <BookmarkIcon />,
    shortcut: "B",
    action: () => chrome.tabs.create({ url: "chrome://bookmarks" }),
  },
  {
    name: "Add this tab to Bookmarks",
    icon: <BookmarkIcon />,
    shortcut: "D",
    action: () =>
      chrome.bookmarks.create({
        title: document.title,
        url: window.location.href,
      }),
  },
  {
    name: "Settings",
    icon: <GearIcon />,
    shortcut: ",",
    action: () => chrome.tabs.create({ url: "chrome://settings" }),
  },
  {
    name: "Reload",
    icon: <ReloadIcon />,
    shortcut: "R",
    action: () => chrome.tabs.reload(),
  },
  {
    name: "New Incognito Window",
    icon: <EyeClosedIcon />,
    shortcut: "⇧N",
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

  // Get system shortcut key
  const systemShortcutKey = getSystemShortcutKey();

  // Function to fetch active tabs
  const fetchActiveTabs = async (): Promise<
    { title: string; url: string; favIconUrl?: string | undefined }[]
  > => {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        const tabList = tabs.map((tab) => ({
          title: tab.title!,
          url: tab.url!,
          favIconUrl: tab.favIconUrl,
        }));
        resolve(tabList);
      });
    });
  };

  useEffect(() => {
    const updateTabsAndCommands = async () => {
      const tabs = await fetchActiveTabs();
      // Create a unique set of tabs based on URL
      const uniqueTabs = Array.from(
        new Map(tabs.map((tab) => [tab.url, tab])).values()
      );
      setActiveTabs(uniqueTabs);

      const filtered = COMMANDS.filter((command) =>
        command.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCommands(filtered);

      // Fetch history suggestions based on query
      if (query) {
        chrome.history.search({ text: query, maxResults: 1000 }, (results) => {
          const validResults = results
            .filter((item) => item.title && item.url)
            .map((item) => ({ title: item.title!, url: item.url! }));

          // Create a unique set of history suggestions based on URL
          const uniqueHistory = Array.from(
            new Map(validResults.map((item) => [item.title, item])).values()
          );
          setHistorySuggestions(uniqueHistory);
        });
      } else {
        // Fetch the last 5 unique history items when query is empty
        chrome.history.search({ text: "", maxResults: 5 }, (results) => {
          const validResults = results
            .filter((item) => item.title && item.url)
            .map((item) => ({ title: item.title!, url: item.url! }));

          // Create a unique set of history suggestions based on URL
          const uniqueHistory = Array.from(
            new Map(validResults.map((item) => [item.title, item])).values()
          );
          setHistorySuggestions(uniqueHistory);
        });
      }
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
    <div className="w-[500px] !bg-transparent flex justify-start items-start">
      <CommandDialog open={true}>
        <CommandInput
          placeholder="Spotlight Search"
          onValueChange={(e) => setQuery(e)}
          onKeyDown={handleKeyDown}
        />
        <CommandList>
          <CommandEmpty>Press Enter to search</CommandEmpty>

          {/* Active Tabs Section */}
          <CommandGroup heading="Active Tabs">
            {activeTabs.map((tab, idx) => (
              <CommandItem
                key={tab.url} // Use URL as the unique key
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

          {/* Commands Section */}
          <CommandGroup heading="Commands">
            {filteredCommands.map((command) => (
              <CommandItem
                key={command.name}
                onSelect={() => handleCommandClick(command.action)}
              >
                <span className="mr-2">{command.icon}</span>
                {command.name}
                <CommandShortcut>{`${systemShortcutKey}${command.shortcut}`}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* History Suggestions Section */}
          <CommandGroup heading="History Suggestions">
            {historySuggestions.map((suggestion, idx) => (
              <CommandItem
                key={suggestion.url} // Use URL as the unique key
                onSelect={() => handleSuggestionClick(suggestion.url)}
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

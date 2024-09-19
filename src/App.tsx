import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    const filtered = COMMANDS.filter((command) =>
      command.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCommands(filtered);

    // Fetch history suggestions
    if (query && !filtered.length) {
      chrome.history.search({ text: query, maxResults: 5 }, (results) => {
        const validResults = results
          .filter((item) => item.title && item.url) // Ensure title and url are defined
          .map((item) => ({ title: item.title!, url: item.url! })); // Use non-null assertion
        setHistorySuggestions(validResults);
      });
    } else {
      setHistorySuggestions([]);
    }
  }, [query]);

  const handleSuggestionClick = (url: string) => {
    chrome.tabs.create({ url });
    setQuery(""); // Clear the input
  };

  const handleCommandClick = (action: () => void) => {
    action();
    setQuery(""); // Clear the input
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (filteredCommands.length === 0 && historySuggestions.length === 0) {
        // Open a new tab with the search query if no matches
        chrome.tabs.create({
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        });
        setQuery(""); // Clear the input
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        padding: "16px",
        width: "384px",
        margin: "auto",
        borderRadius: "8px",
      }}
    >
      <input
        type="text"
        style={{
          width: "100%",
          padding: "8px",
          color: "#fff",
          backgroundColor: "#333",
          borderRadius: "4px",
        }}
        placeholder="Type a command or search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <ul style={{ marginTop: "16px", listStyleType: "none", padding: 0 }}>
        {filteredCommands.map((command, idx) => (
          <li
            key={idx}
            style={{ padding: "8px", color: "#fff", cursor: "pointer" }}
            onClick={() => handleCommandClick(command.action)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#444")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {command.name}
          </li>
        ))}
        {historySuggestions.map((suggestion, idx) => (
          <li
            key={idx}
            style={{ padding: "8px", color: "#fff", cursor: "pointer" }}
            onClick={() => handleSuggestionClick(suggestion.url)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#444")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {suggestion.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandPalette;

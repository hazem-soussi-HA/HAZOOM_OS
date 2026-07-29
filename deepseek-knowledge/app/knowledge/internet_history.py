INTERNET_HISTORY_SCRIPTS = {
    "ARPANET Origins": """
The story of the internet begins in the late 1960s with ARPANET, a project funded by the U.S. Department of Defense's Advanced Research Projects Agency (ARPA). 

In 1969, four network nodes were connected: UCLA, Stanford Research Institute, UCSB, and the University of Utah. This marked the first time computers could communicate with each other over a network.

The original ARPANET used packet switching technology, which broke data into small packets and sent them independently across the network. This was revolutionary compared to the circuit-switched telephone networks of the time.

Key innovations included:
- TCP/IP protocols developed by Vint Cerf and Bob Kahn in 1973
- The first email system created by Ray Tomlinson in 1971
- The first networked computer game, Spacewar!
""",

    "TCP/IP Revolution": """
The TCP/IP protocol suite, developed between 1973-1978, became the foundation of the modern internet. Vint Cerf and Bob Kahn designed these protocols to allow different networks to communicate with each other.

In 1983, ARPANET officially switched to using TCP/IP, marking the birth of the internet as we know it. This protocol suite included:
- Transmission Control Protocol (TCP) for reliable data delivery
- Internet Protocol (IP) for addressing and routing

The adoption of TCP/IP enabled the interconnection of multiple networks, creating a "network of networks" - the internet.
""",

    "Domain Name System (DNS)": """
Before 1983, accessing computers on the network required typing numerical IP addresses. This was difficult for users to remember and use.

In 1983, Paul Mockapetris invented the Domain Name System (DNS), which translated human-readable domain names (like example.com) into machine-readable IP addresses.

DNS introduced:
- Top-level domains (.com, .org, .edu, etc.)
- Second-level domains (example.com)
- The concept of a distributed database system

This made the internet accessible to non-technical users and sparked the dot-com boom of the 1990s.
""",

    "World Wide Web": """
While the internet was growing, it remained primarily a tool for researchers and academics. In 1989, Tim Berners-Lee at CERN proposed a system called the World Wide Web.

Berners-Lee's innovations included:
- Hypertext Markup Language (HTML) for structuring web content
- Hypertext Transfer Protocol (HTTP) for data transfer
- Uniform Resource Locators (URLs) for resource identification

In 1990, he created the first web browser, editor, and web server. By 1991, the World Wide Web was available to other research institutions.

The web transformed the internet from a network of computers into a network of information, making it accessible to everyone.
""",

    "Commercial Internet": """
The early 1990s saw the commercialization of the internet. Key developments included:

- The first commercial web browser, Mosaic, released in 1993
- The introduction of graphical web interfaces
- The rise of commercial internet service providers (ISPs)
- The first online businesses and e-commerce sites

Mosaic's popularity led to the creation of Netscape Navigator in 1994, which dominated the browser market and ushered in the "browser wars."

This period marked the transition from academic to commercial use, with businesses recognizing the internet's potential for marketing, sales, and customer service.
""",

    "Dot-Com Boom & Bust": """
The late 1990s and early 2000s were characterized by explosive growth in internet usage and investment. This period, known as the dot-com boom, saw:

- Massive investment in internet startups
- Rapid growth in e-commerce
- The rise of companies like Amazon, eBay, and Google
- Widespread adoption of internet connectivity

However, this growth was unsustainable. By 2000-2001, the bubble burst, leading to:
- Thousands of dot-com companies failing
- Massive job losses
- A significant decline in internet investment

The bust taught valuable lessons about sustainable business models and realistic growth expectations.
""",

    "Web 2.0 Era": """
The early 2000s brought the next evolution: Web 2.0. This era was characterized by:

- User-generated content
- Social media platforms
- Rich internet applications
- The rise of companies like Facebook, Twitter, YouTube, and Wikipedia

Key technologies included:
- AJAX (Asynchronous JavaScript and XML)
- Rich internet application frameworks
- Cloud computing infrastructure

Web 2.0 transformed the internet from a read-only medium to an interactive platform where users could create, share, and collaborate.
""",

    "Mobile Revolution": """
The introduction of smartphones in the late 2000s revolutionized internet access. By 2007, when the iPhone was introduced, mobile internet usage began to surpass desktop usage.

This mobile revolution brought:
- App-based internet experiences
- Location-based services
- Mobile-first web design
- The rise of companies like Instagram, Snapchat, and Uber

Mobile connectivity made the internet truly ubiquitous, accessible anywhere, anytime.
""",

    "Modern Internet": """
Today's internet is a global infrastructure connecting billions of devices. Key characteristics include:

- Cloud computing and serverless architecture
- Internet of Things (IoT) connectivity
- Artificial intelligence and machine learning
- Edge computing for reduced latency
- 5G networks for faster mobile connectivity

The modern internet supports:
- Video streaming services (Netflix, YouTube)
- Social media and communication platforms
- E-commerce and digital payments
- Remote work and education
- Healthcare and telemedicine

Looking forward, the internet continues to evolve with technologies like Web3, blockchain, and quantum computing poised to reshape how we interact with digital information.
""",
}


def get_script(topic: str) -> str:
    """Get a script for a specific internet history topic."""
    return INTERNET_HISTORY_SCRIPTS.get(topic, "Script not found")


def get_all_topics() -> list[str]:
    """Get all available internet history topics."""
    return list(INTERNET_HISTORY_SCRIPTS.keys())
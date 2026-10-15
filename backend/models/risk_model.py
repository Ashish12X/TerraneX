BLOCK_THRESHOLD = 0.5


def rain_factor(rainfall_mm: float) -> float:
    """Rainfall ko 0-1.5 ke multiplier mein badalta hai."""
    return min(max(rainfall_mm, 0) / 100.0, 1.5)


def get_edge_risk(susceptibility: float, rainfall_mm: float) -> float:
    """
    Road ka landslide risk (0-1).
    Abhi rule-based: susceptibility x rainfall factor.
    Baad mein yahan ML model (slope, geology, rainfall history) aayega.
    """
    return round(min(susceptibility * rain_factor(rainfall_mm), 1.0), 3)


def is_blocked(risk: float) -> bool:
    return risk >= BLOCK_THRESHOLD
import xml.etree.ElementTree as ET


class SECParser:

    def parse(self, xml_text):

        events = []

        root = ET.fromstring(xml_text)

        for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):

            title = entry.find("{http://www.w3.org/2005/Atom}title").text

            events.append({
                "title": title
            })

        return events
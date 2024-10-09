# Dockerfile.template

FROM ubuntu:22.04

# Set the IANA time zone version
ARG IANA_TZ_VERSION=2024b

# Install dependencies
RUN apt-get update
RUN apt-get install -y build-essential make tar curl
RUN rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /tz

# Download tzdata and tzcode based on the version
RUN curl -o tzdata.tar.gz https://data.iana.org/time-zones/releases/tzdata${IANA_TZ_VERSION}.tar.gz
RUN curl -o tzcode.tar.gz https://data.iana.org/time-zones/releases/tzcode${IANA_TZ_VERSION}.tar.gz

# Verify the SHA-256 checksum
RUN echo "70e754db126a8d0db3d16d6b4cb5f7ec1e04d5f261255e4558a67fe92d39e550  tzdata.tar.gz" | sha256sum -c -
RUN echo "5e438fc449624906af16a18ff4573739f0cda9862e5ec28d3bcb19cbaed0f672  tzcode.tar.gz" | sha256sum -c -

# Extract the downloaded files into /tz
RUN tar -xzf tzdata.tar.gz -C /tz
RUN tar -xzf tzcode.tar.gz -C /tz

# Pre-compile tzdata
ENV TOPDIR=/tzdir

# Create the necessary directories
RUN mkdir -p /tzdir/usr/sbin /tzdir/usr/bin /tz_data_generated /zic /tz_data_generated/zdump

# Install tzdata and compile zic files
RUN make TOPDIR=/tzdir install
RUN echo 'Compiling zic data'
RUN /tzdir/usr/sbin/zic -d /zic backward africa antarctica asia australasia etcetera europe northamerica southamerica
RUN cp /tz/backward /tz_data_generated
RUN echo 'Compiling zdump data'

# Compile zdump data for all zones
RUN mkdir -p /tz_data_generated/zdump
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Abidjan > /tz_data_generated/zdump/Africa/Abidjan
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Accra > /tz_data_generated/zdump/Africa/Accra
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Addis_Ababa > /tz_data_generated/zdump/Africa/Addis_Ababa
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Algiers > /tz_data_generated/zdump/Africa/Algiers
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Asmara > /tz_data_generated/zdump/Africa/Asmara
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Bamako > /tz_data_generated/zdump/Africa/Bamako
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Bangui > /tz_data_generated/zdump/Africa/Bangui
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Banjul > /tz_data_generated/zdump/Africa/Banjul
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Bissau > /tz_data_generated/zdump/Africa/Bissau
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Blantyre > /tz_data_generated/zdump/Africa/Blantyre
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Brazzaville > /tz_data_generated/zdump/Africa/Brazzaville
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Bujumbura > /tz_data_generated/zdump/Africa/Bujumbura
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Cairo > /tz_data_generated/zdump/Africa/Cairo
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Casablanca > /tz_data_generated/zdump/Africa/Casablanca
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Ceuta > /tz_data_generated/zdump/Africa/Ceuta
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Conakry > /tz_data_generated/zdump/Africa/Conakry
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Dakar > /tz_data_generated/zdump/Africa/Dakar
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Dar_es_Salaam > /tz_data_generated/zdump/Africa/Dar_es_Salaam
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Djibouti > /tz_data_generated/zdump/Africa/Djibouti
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Douala > /tz_data_generated/zdump/Africa/Douala
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/El_Aaiun > /tz_data_generated/zdump/Africa/El_Aaiun
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Freetown > /tz_data_generated/zdump/Africa/Freetown
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Gaborone > /tz_data_generated/zdump/Africa/Gaborone
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Harare > /tz_data_generated/zdump/Africa/Harare
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Johannesburg > /tz_data_generated/zdump/Africa/Johannesburg
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Juba > /tz_data_generated/zdump/Africa/Juba
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Kampala > /tz_data_generated/zdump/Africa/Kampala
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Khartoum > /tz_data_generated/zdump/Africa/Khartoum
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Kigali > /tz_data_generated/zdump/Africa/Kigali
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Kinshasa > /tz_data_generated/zdump/Africa/Kinshasa
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Lagos > /tz_data_generated/zdump/Africa/Lagos
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Libreville > /tz_data_generated/zdump/Africa/Libreville
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Lome > /tz_data_generated/zdump/Africa/Lome
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Luanda > /tz_data_generated/zdump/Africa/Luanda
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Lubumbashi > /tz_data_generated/zdump/Africa/Lubumbashi
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Lusaka > /tz_data_generated/zdump/Africa/Lusaka
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Malabo > /tz_data_generated/zdump/Africa/Malabo
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Maputo > /tz_data_generated/zdump/Africa/Maputo
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Maseru > /tz_data_generated/zdump/Africa/Maseru
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Mbabane > /tz_data_generated/zdump/Africa/Mbabane
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Mogadishu > /tz_data_generated/zdump/Africa/Mogadishu
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Monrovia > /tz_data_generated/zdump/Africa/Monrovia
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Nairobi > /tz_data_generated/zdump/Africa/Nairobi
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Ndjamena > /tz_data_generated/zdump/Africa/Ndjamena
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Niamey > /tz_data_generated/zdump/Africa/Niamey
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Nouakchott > /tz_data_generated/zdump/Africa/Nouakchott
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Ouagadougou > /tz_data_generated/zdump/Africa/Ouagadougou
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Porto-Novo > /tz_data_generated/zdump/Africa/Porto-Novo
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Sao_Tome > /tz_data_generated/zdump/Africa/Sao_Tome
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Tripoli > /tz_data_generated/zdump/Africa/Tripoli
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Tunis > /tz_data_generated/zdump/Africa/Tunis
RUN mkdir -p /tz_data_generated/zdump/Africa
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Africa/Windhoek > /tz_data_generated/zdump/Africa/Windhoek
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Adak > /tz_data_generated/zdump/America/Adak
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Anchorage > /tz_data_generated/zdump/America/Anchorage
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Anguilla > /tz_data_generated/zdump/America/Anguilla
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Antigua > /tz_data_generated/zdump/America/Antigua
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Araguaina > /tz_data_generated/zdump/America/Araguaina
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Buenos_Aires > /tz_data_generated/zdump/America/Argentina/Buenos_Aires
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Catamarca > /tz_data_generated/zdump/America/Argentina/Catamarca
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Cordoba > /tz_data_generated/zdump/America/Argentina/Cordoba
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Jujuy > /tz_data_generated/zdump/America/Argentina/Jujuy
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/La_Rioja > /tz_data_generated/zdump/America/Argentina/La_Rioja
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Mendoza > /tz_data_generated/zdump/America/Argentina/Mendoza
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Rio_Gallegos > /tz_data_generated/zdump/America/Argentina/Rio_Gallegos
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Salta > /tz_data_generated/zdump/America/Argentina/Salta
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/San_Juan > /tz_data_generated/zdump/America/Argentina/San_Juan
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/San_Luis > /tz_data_generated/zdump/America/Argentina/San_Luis
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Tucuman > /tz_data_generated/zdump/America/Argentina/Tucuman
RUN mkdir -p /tz_data_generated/zdump/America/Argentina
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Argentina/Ushuaia > /tz_data_generated/zdump/America/Argentina/Ushuaia
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Aruba > /tz_data_generated/zdump/America/Aruba
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Asuncion > /tz_data_generated/zdump/America/Asuncion
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Atikokan > /tz_data_generated/zdump/America/Atikokan
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Bahia_Banderas > /tz_data_generated/zdump/America/Bahia_Banderas
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Bahia > /tz_data_generated/zdump/America/Bahia
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Barbados > /tz_data_generated/zdump/America/Barbados
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Belem > /tz_data_generated/zdump/America/Belem
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Belize > /tz_data_generated/zdump/America/Belize
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Blanc-Sablon > /tz_data_generated/zdump/America/Blanc-Sablon
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Boa_Vista > /tz_data_generated/zdump/America/Boa_Vista
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Bogota > /tz_data_generated/zdump/America/Bogota
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Boise > /tz_data_generated/zdump/America/Boise
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Cambridge_Bay > /tz_data_generated/zdump/America/Cambridge_Bay
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Campo_Grande > /tz_data_generated/zdump/America/Campo_Grande
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Cancun > /tz_data_generated/zdump/America/Cancun
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Caracas > /tz_data_generated/zdump/America/Caracas
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Cayenne > /tz_data_generated/zdump/America/Cayenne
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Cayman > /tz_data_generated/zdump/America/Cayman
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Chicago > /tz_data_generated/zdump/America/Chicago
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Chihuahua > /tz_data_generated/zdump/America/Chihuahua
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Ciudad_Juarez > /tz_data_generated/zdump/America/Ciudad_Juarez
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Costa_Rica > /tz_data_generated/zdump/America/Costa_Rica
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Creston > /tz_data_generated/zdump/America/Creston
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Cuiaba > /tz_data_generated/zdump/America/Cuiaba
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Curacao > /tz_data_generated/zdump/America/Curacao
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Danmarkshavn > /tz_data_generated/zdump/America/Danmarkshavn
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Dawson_Creek > /tz_data_generated/zdump/America/Dawson_Creek
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Dawson > /tz_data_generated/zdump/America/Dawson
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Denver > /tz_data_generated/zdump/America/Denver
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Detroit > /tz_data_generated/zdump/America/Detroit
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Dominica > /tz_data_generated/zdump/America/Dominica
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Edmonton > /tz_data_generated/zdump/America/Edmonton
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Eirunepe > /tz_data_generated/zdump/America/Eirunepe
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/El_Salvador > /tz_data_generated/zdump/America/El_Salvador
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Fort_Nelson > /tz_data_generated/zdump/America/Fort_Nelson
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Fortaleza > /tz_data_generated/zdump/America/Fortaleza
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Glace_Bay > /tz_data_generated/zdump/America/Glace_Bay
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Goose_Bay > /tz_data_generated/zdump/America/Goose_Bay
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Grand_Turk > /tz_data_generated/zdump/America/Grand_Turk
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Grenada > /tz_data_generated/zdump/America/Grenada
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Guadeloupe > /tz_data_generated/zdump/America/Guadeloupe
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Guatemala > /tz_data_generated/zdump/America/Guatemala
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Guayaquil > /tz_data_generated/zdump/America/Guayaquil
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Guyana > /tz_data_generated/zdump/America/Guyana
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Halifax > /tz_data_generated/zdump/America/Halifax
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Havana > /tz_data_generated/zdump/America/Havana
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Hermosillo > /tz_data_generated/zdump/America/Hermosillo
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Indianapolis > /tz_data_generated/zdump/America/Indiana/Indianapolis
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Knox > /tz_data_generated/zdump/America/Indiana/Knox
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Marengo > /tz_data_generated/zdump/America/Indiana/Marengo
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Petersburg > /tz_data_generated/zdump/America/Indiana/Petersburg
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Tell_City > /tz_data_generated/zdump/America/Indiana/Tell_City
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Vevay > /tz_data_generated/zdump/America/Indiana/Vevay
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Vincennes > /tz_data_generated/zdump/America/Indiana/Vincennes
RUN mkdir -p /tz_data_generated/zdump/America/Indiana
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Indiana/Winamac > /tz_data_generated/zdump/America/Indiana/Winamac
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Inuvik > /tz_data_generated/zdump/America/Inuvik
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Iqaluit > /tz_data_generated/zdump/America/Iqaluit
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Jamaica > /tz_data_generated/zdump/America/Jamaica
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Juneau > /tz_data_generated/zdump/America/Juneau
RUN mkdir -p /tz_data_generated/zdump/America/Kentucky
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Kentucky/Louisville > /tz_data_generated/zdump/America/Kentucky/Louisville
RUN mkdir -p /tz_data_generated/zdump/America/Kentucky
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Kentucky/Monticello > /tz_data_generated/zdump/America/Kentucky/Monticello
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Kralendijk > /tz_data_generated/zdump/America/Kralendijk
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/La_Paz > /tz_data_generated/zdump/America/La_Paz
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Lima > /tz_data_generated/zdump/America/Lima
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Los_Angeles > /tz_data_generated/zdump/America/Los_Angeles
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Lower_Princes > /tz_data_generated/zdump/America/Lower_Princes
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Maceio > /tz_data_generated/zdump/America/Maceio
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Managua > /tz_data_generated/zdump/America/Managua
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Manaus > /tz_data_generated/zdump/America/Manaus
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Marigot > /tz_data_generated/zdump/America/Marigot
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Martinique > /tz_data_generated/zdump/America/Martinique
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Matamoros > /tz_data_generated/zdump/America/Matamoros
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Mazatlan > /tz_data_generated/zdump/America/Mazatlan
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Menominee > /tz_data_generated/zdump/America/Menominee
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Merida > /tz_data_generated/zdump/America/Merida
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Metlakatla > /tz_data_generated/zdump/America/Metlakatla
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Mexico_City > /tz_data_generated/zdump/America/Mexico_City
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Miquelon > /tz_data_generated/zdump/America/Miquelon
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Moncton > /tz_data_generated/zdump/America/Moncton
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Monterrey > /tz_data_generated/zdump/America/Monterrey
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Montevideo > /tz_data_generated/zdump/America/Montevideo
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Montserrat > /tz_data_generated/zdump/America/Montserrat
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Nassau > /tz_data_generated/zdump/America/Nassau
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/New_York > /tz_data_generated/zdump/America/New_York
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Nipigon > /tz_data_generated/zdump/America/Nipigon
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Nome > /tz_data_generated/zdump/America/Nome
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Noronha > /tz_data_generated/zdump/America/Noronha
RUN mkdir -p /tz_data_generated/zdump/America/North_Dakota
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/North_Dakota/Beulah > /tz_data_generated/zdump/America/North_Dakota/Beulah
RUN mkdir -p /tz_data_generated/zdump/America/North_Dakota
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/North_Dakota/Center > /tz_data_generated/zdump/America/North_Dakota/Center
RUN mkdir -p /tz_data_generated/zdump/America/North_Dakota
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/North_Dakota/New_Salem > /tz_data_generated/zdump/America/North_Dakota/New_Salem
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Nuuk > /tz_data_generated/zdump/America/Nuuk
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Ojinaga > /tz_data_generated/zdump/America/Ojinaga
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Panama > /tz_data_generated/zdump/America/Panama
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Pangnirtung > /tz_data_generated/zdump/America/Pangnirtung
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Paramaribo > /tz_data_generated/zdump/America/Paramaribo
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Phoenix > /tz_data_generated/zdump/America/Phoenix
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Port_of_Spain > /tz_data_generated/zdump/America/Port_of_Spain
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Port-au-Prince > /tz_data_generated/zdump/America/Port-au-Prince
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Porto_Velho > /tz_data_generated/zdump/America/Porto_Velho
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Puerto_Rico > /tz_data_generated/zdump/America/Puerto_Rico
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Punta_Arenas > /tz_data_generated/zdump/America/Punta_Arenas
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Rainy_River > /tz_data_generated/zdump/America/Rainy_River
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Rankin_Inlet > /tz_data_generated/zdump/America/Rankin_Inlet
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Recife > /tz_data_generated/zdump/America/Recife
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Regina > /tz_data_generated/zdump/America/Regina
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Resolute > /tz_data_generated/zdump/America/Resolute
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Rio_Branco > /tz_data_generated/zdump/America/Rio_Branco
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Santarem > /tz_data_generated/zdump/America/Santarem
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Santiago > /tz_data_generated/zdump/America/Santiago
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Santo_Domingo > /tz_data_generated/zdump/America/Santo_Domingo
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Sao_Paulo > /tz_data_generated/zdump/America/Sao_Paulo
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Scoresbysund > /tz_data_generated/zdump/America/Scoresbysund
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Sitka > /tz_data_generated/zdump/America/Sitka
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/St_Barthelemy > /tz_data_generated/zdump/America/St_Barthelemy
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/St_Johns > /tz_data_generated/zdump/America/St_Johns
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/St_Kitts > /tz_data_generated/zdump/America/St_Kitts
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/St_Lucia > /tz_data_generated/zdump/America/St_Lucia
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/St_Thomas > /tz_data_generated/zdump/America/St_Thomas
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/St_Vincent > /tz_data_generated/zdump/America/St_Vincent
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Swift_Current > /tz_data_generated/zdump/America/Swift_Current
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Tegucigalpa > /tz_data_generated/zdump/America/Tegucigalpa
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Thule > /tz_data_generated/zdump/America/Thule
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Thunder_Bay > /tz_data_generated/zdump/America/Thunder_Bay
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Tijuana > /tz_data_generated/zdump/America/Tijuana
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Toronto > /tz_data_generated/zdump/America/Toronto
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Tortola > /tz_data_generated/zdump/America/Tortola
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Vancouver > /tz_data_generated/zdump/America/Vancouver
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Whitehorse > /tz_data_generated/zdump/America/Whitehorse
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Winnipeg > /tz_data_generated/zdump/America/Winnipeg
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Yakutat > /tz_data_generated/zdump/America/Yakutat
RUN mkdir -p /tz_data_generated/zdump/America
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/America/Yellowknife > /tz_data_generated/zdump/America/Yellowknife
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Casey > /tz_data_generated/zdump/Antarctica/Casey
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Davis > /tz_data_generated/zdump/Antarctica/Davis
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/DumontDUrville > /tz_data_generated/zdump/Antarctica/DumontDUrville
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Macquarie > /tz_data_generated/zdump/Antarctica/Macquarie
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Mawson > /tz_data_generated/zdump/Antarctica/Mawson
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/McMurdo > /tz_data_generated/zdump/Antarctica/McMurdo
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Palmer > /tz_data_generated/zdump/Antarctica/Palmer
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Rothera > /tz_data_generated/zdump/Antarctica/Rothera
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Syowa > /tz_data_generated/zdump/Antarctica/Syowa
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Troll > /tz_data_generated/zdump/Antarctica/Troll
RUN mkdir -p /tz_data_generated/zdump/Antarctica
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Antarctica/Vostok > /tz_data_generated/zdump/Antarctica/Vostok
RUN mkdir -p /tz_data_generated/zdump/Arctic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Arctic/Longyearbyen > /tz_data_generated/zdump/Arctic/Longyearbyen
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Aden > /tz_data_generated/zdump/Asia/Aden
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Almaty > /tz_data_generated/zdump/Asia/Almaty
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Amman > /tz_data_generated/zdump/Asia/Amman
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Anadyr > /tz_data_generated/zdump/Asia/Anadyr
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Aqtau > /tz_data_generated/zdump/Asia/Aqtau
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Aqtobe > /tz_data_generated/zdump/Asia/Aqtobe
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Ashgabat > /tz_data_generated/zdump/Asia/Ashgabat
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Atyrau > /tz_data_generated/zdump/Asia/Atyrau
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Baghdad > /tz_data_generated/zdump/Asia/Baghdad
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Bahrain > /tz_data_generated/zdump/Asia/Bahrain
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Baku > /tz_data_generated/zdump/Asia/Baku
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Bangkok > /tz_data_generated/zdump/Asia/Bangkok
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Barnaul > /tz_data_generated/zdump/Asia/Barnaul
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Beirut > /tz_data_generated/zdump/Asia/Beirut
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Bishkek > /tz_data_generated/zdump/Asia/Bishkek
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Brunei > /tz_data_generated/zdump/Asia/Brunei
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Chita > /tz_data_generated/zdump/Asia/Chita
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Choibalsan > /tz_data_generated/zdump/Asia/Choibalsan
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Colombo > /tz_data_generated/zdump/Asia/Colombo
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Damascus > /tz_data_generated/zdump/Asia/Damascus
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Dhaka > /tz_data_generated/zdump/Asia/Dhaka
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Dili > /tz_data_generated/zdump/Asia/Dili
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Dubai > /tz_data_generated/zdump/Asia/Dubai
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Dushanbe > /tz_data_generated/zdump/Asia/Dushanbe
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Famagusta > /tz_data_generated/zdump/Asia/Famagusta
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Gaza > /tz_data_generated/zdump/Asia/Gaza
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Hebron > /tz_data_generated/zdump/Asia/Hebron
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Ho_Chi_Minh > /tz_data_generated/zdump/Asia/Ho_Chi_Minh
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Hong_Kong > /tz_data_generated/zdump/Asia/Hong_Kong
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Hovd > /tz_data_generated/zdump/Asia/Hovd
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Irkutsk > /tz_data_generated/zdump/Asia/Irkutsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Jakarta > /tz_data_generated/zdump/Asia/Jakarta
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Jayapura > /tz_data_generated/zdump/Asia/Jayapura
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Jerusalem > /tz_data_generated/zdump/Asia/Jerusalem
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kabul > /tz_data_generated/zdump/Asia/Kabul
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kamchatka > /tz_data_generated/zdump/Asia/Kamchatka
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Karachi > /tz_data_generated/zdump/Asia/Karachi
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kathmandu > /tz_data_generated/zdump/Asia/Kathmandu
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Khandyga > /tz_data_generated/zdump/Asia/Khandyga
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kolkata > /tz_data_generated/zdump/Asia/Kolkata
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Krasnoyarsk > /tz_data_generated/zdump/Asia/Krasnoyarsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kuala_Lumpur > /tz_data_generated/zdump/Asia/Kuala_Lumpur
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kuching > /tz_data_generated/zdump/Asia/Kuching
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Kuwait > /tz_data_generated/zdump/Asia/Kuwait
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Macau > /tz_data_generated/zdump/Asia/Macau
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Magadan > /tz_data_generated/zdump/Asia/Magadan
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Makassar > /tz_data_generated/zdump/Asia/Makassar
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Manila > /tz_data_generated/zdump/Asia/Manila
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Muscat > /tz_data_generated/zdump/Asia/Muscat
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Nicosia > /tz_data_generated/zdump/Asia/Nicosia
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Novokuznetsk > /tz_data_generated/zdump/Asia/Novokuznetsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Novosibirsk > /tz_data_generated/zdump/Asia/Novosibirsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Omsk > /tz_data_generated/zdump/Asia/Omsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Oral > /tz_data_generated/zdump/Asia/Oral
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Phnom_Penh > /tz_data_generated/zdump/Asia/Phnom_Penh
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Pontianak > /tz_data_generated/zdump/Asia/Pontianak
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Pyongyang > /tz_data_generated/zdump/Asia/Pyongyang
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Qatar > /tz_data_generated/zdump/Asia/Qatar
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Qostanay > /tz_data_generated/zdump/Asia/Qostanay
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Qyzylorda > /tz_data_generated/zdump/Asia/Qyzylorda
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Riyadh > /tz_data_generated/zdump/Asia/Riyadh
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Sakhalin > /tz_data_generated/zdump/Asia/Sakhalin
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Samarkand > /tz_data_generated/zdump/Asia/Samarkand
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Seoul > /tz_data_generated/zdump/Asia/Seoul
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Shanghai > /tz_data_generated/zdump/Asia/Shanghai
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Singapore > /tz_data_generated/zdump/Asia/Singapore
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Srednekolymsk > /tz_data_generated/zdump/Asia/Srednekolymsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Taipei > /tz_data_generated/zdump/Asia/Taipei
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Tashkent > /tz_data_generated/zdump/Asia/Tashkent
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Tbilisi > /tz_data_generated/zdump/Asia/Tbilisi
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Tehran > /tz_data_generated/zdump/Asia/Tehran
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Thimphu > /tz_data_generated/zdump/Asia/Thimphu
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Tokyo > /tz_data_generated/zdump/Asia/Tokyo
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Tomsk > /tz_data_generated/zdump/Asia/Tomsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Ulaanbaatar > /tz_data_generated/zdump/Asia/Ulaanbaatar
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Urumqi > /tz_data_generated/zdump/Asia/Urumqi
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Ust-Nera > /tz_data_generated/zdump/Asia/Ust-Nera
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Vientiane > /tz_data_generated/zdump/Asia/Vientiane
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Vladivostok > /tz_data_generated/zdump/Asia/Vladivostok
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Yakutsk > /tz_data_generated/zdump/Asia/Yakutsk
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Yangon > /tz_data_generated/zdump/Asia/Yangon
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Yekaterinburg > /tz_data_generated/zdump/Asia/Yekaterinburg
RUN mkdir -p /tz_data_generated/zdump/Asia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Asia/Yerevan > /tz_data_generated/zdump/Asia/Yerevan
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Azores > /tz_data_generated/zdump/Atlantic/Azores
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Bermuda > /tz_data_generated/zdump/Atlantic/Bermuda
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Canary > /tz_data_generated/zdump/Atlantic/Canary
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Cape_Verde > /tz_data_generated/zdump/Atlantic/Cape_Verde
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Faroe > /tz_data_generated/zdump/Atlantic/Faroe
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Madeira > /tz_data_generated/zdump/Atlantic/Madeira
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Reykjavik > /tz_data_generated/zdump/Atlantic/Reykjavik
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/South_Georgia > /tz_data_generated/zdump/Atlantic/South_Georgia
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/St_Helena > /tz_data_generated/zdump/Atlantic/St_Helena
RUN mkdir -p /tz_data_generated/zdump/Atlantic
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Atlantic/Stanley > /tz_data_generated/zdump/Atlantic/Stanley
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Adelaide > /tz_data_generated/zdump/Australia/Adelaide
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Brisbane > /tz_data_generated/zdump/Australia/Brisbane
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Broken_Hill > /tz_data_generated/zdump/Australia/Broken_Hill
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Currie > /tz_data_generated/zdump/Australia/Currie
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Darwin > /tz_data_generated/zdump/Australia/Darwin
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Eucla > /tz_data_generated/zdump/Australia/Eucla
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Hobart > /tz_data_generated/zdump/Australia/Hobart
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Lindeman > /tz_data_generated/zdump/Australia/Lindeman
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Lord_Howe > /tz_data_generated/zdump/Australia/Lord_Howe
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Melbourne > /tz_data_generated/zdump/Australia/Melbourne
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Perth > /tz_data_generated/zdump/Australia/Perth
RUN mkdir -p /tz_data_generated/zdump/Australia
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Australia/Sydney > /tz_data_generated/zdump/Australia/Sydney
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Amsterdam > /tz_data_generated/zdump/Europe/Amsterdam
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Andorra > /tz_data_generated/zdump/Europe/Andorra
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Astrakhan > /tz_data_generated/zdump/Europe/Astrakhan
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Athens > /tz_data_generated/zdump/Europe/Athens
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Belgrade > /tz_data_generated/zdump/Europe/Belgrade
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Berlin > /tz_data_generated/zdump/Europe/Berlin
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Bratislava > /tz_data_generated/zdump/Europe/Bratislava
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Brussels > /tz_data_generated/zdump/Europe/Brussels
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Bucharest > /tz_data_generated/zdump/Europe/Bucharest
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Budapest > /tz_data_generated/zdump/Europe/Budapest
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Busingen > /tz_data_generated/zdump/Europe/Busingen
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Chisinau > /tz_data_generated/zdump/Europe/Chisinau
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Copenhagen > /tz_data_generated/zdump/Europe/Copenhagen
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Dublin > /tz_data_generated/zdump/Europe/Dublin
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Gibraltar > /tz_data_generated/zdump/Europe/Gibraltar
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Guernsey > /tz_data_generated/zdump/Europe/Guernsey
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Helsinki > /tz_data_generated/zdump/Europe/Helsinki
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Isle_of_Man > /tz_data_generated/zdump/Europe/Isle_of_Man
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Istanbul > /tz_data_generated/zdump/Europe/Istanbul
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Jersey > /tz_data_generated/zdump/Europe/Jersey
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Kaliningrad > /tz_data_generated/zdump/Europe/Kaliningrad
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Kyiv > /tz_data_generated/zdump/Europe/Kyiv
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Kirov > /tz_data_generated/zdump/Europe/Kirov
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Lisbon > /tz_data_generated/zdump/Europe/Lisbon
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Ljubljana > /tz_data_generated/zdump/Europe/Ljubljana
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/London > /tz_data_generated/zdump/Europe/London
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Luxembourg > /tz_data_generated/zdump/Europe/Luxembourg
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Madrid > /tz_data_generated/zdump/Europe/Madrid
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Malta > /tz_data_generated/zdump/Europe/Malta
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Mariehamn > /tz_data_generated/zdump/Europe/Mariehamn
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Minsk > /tz_data_generated/zdump/Europe/Minsk
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Monaco > /tz_data_generated/zdump/Europe/Monaco
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Moscow > /tz_data_generated/zdump/Europe/Moscow
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Oslo > /tz_data_generated/zdump/Europe/Oslo
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Paris > /tz_data_generated/zdump/Europe/Paris
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Podgorica > /tz_data_generated/zdump/Europe/Podgorica
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Prague > /tz_data_generated/zdump/Europe/Prague
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Riga > /tz_data_generated/zdump/Europe/Riga
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Rome > /tz_data_generated/zdump/Europe/Rome
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Samara > /tz_data_generated/zdump/Europe/Samara
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/San_Marino > /tz_data_generated/zdump/Europe/San_Marino
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Sarajevo > /tz_data_generated/zdump/Europe/Sarajevo
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Saratov > /tz_data_generated/zdump/Europe/Saratov
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Simferopol > /tz_data_generated/zdump/Europe/Simferopol
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Skopje > /tz_data_generated/zdump/Europe/Skopje
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Sofia > /tz_data_generated/zdump/Europe/Sofia
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Stockholm > /tz_data_generated/zdump/Europe/Stockholm
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Tallinn > /tz_data_generated/zdump/Europe/Tallinn
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Tirane > /tz_data_generated/zdump/Europe/Tirane
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Ulyanovsk > /tz_data_generated/zdump/Europe/Ulyanovsk
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Uzhgorod > /tz_data_generated/zdump/Europe/Uzhgorod
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Vaduz > /tz_data_generated/zdump/Europe/Vaduz
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Vatican > /tz_data_generated/zdump/Europe/Vatican
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Vienna > /tz_data_generated/zdump/Europe/Vienna
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Vilnius > /tz_data_generated/zdump/Europe/Vilnius
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Volgograd > /tz_data_generated/zdump/Europe/Volgograd
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Warsaw > /tz_data_generated/zdump/Europe/Warsaw
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Zagreb > /tz_data_generated/zdump/Europe/Zagreb
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Zaporozhye > /tz_data_generated/zdump/Europe/Zaporozhye
RUN mkdir -p /tz_data_generated/zdump/Europe
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Europe/Zurich > /tz_data_generated/zdump/Europe/Zurich
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Antananarivo > /tz_data_generated/zdump/Indian/Antananarivo
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Chagos > /tz_data_generated/zdump/Indian/Chagos
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Christmas > /tz_data_generated/zdump/Indian/Christmas
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Cocos > /tz_data_generated/zdump/Indian/Cocos
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Comoro > /tz_data_generated/zdump/Indian/Comoro
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Kerguelen > /tz_data_generated/zdump/Indian/Kerguelen
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Mahe > /tz_data_generated/zdump/Indian/Mahe
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Maldives > /tz_data_generated/zdump/Indian/Maldives
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Mauritius > /tz_data_generated/zdump/Indian/Mauritius
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Mayotte > /tz_data_generated/zdump/Indian/Mayotte
RUN mkdir -p /tz_data_generated/zdump/Indian
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Indian/Reunion > /tz_data_generated/zdump/Indian/Reunion
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Apia > /tz_data_generated/zdump/Pacific/Apia
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Auckland > /tz_data_generated/zdump/Pacific/Auckland
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Bougainville > /tz_data_generated/zdump/Pacific/Bougainville
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Chatham > /tz_data_generated/zdump/Pacific/Chatham
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Chuuk > /tz_data_generated/zdump/Pacific/Chuuk
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Easter > /tz_data_generated/zdump/Pacific/Easter
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Efate > /tz_data_generated/zdump/Pacific/Efate
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Kanton > /tz_data_generated/zdump/Pacific/Kanton
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Fakaofo > /tz_data_generated/zdump/Pacific/Fakaofo
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Fiji > /tz_data_generated/zdump/Pacific/Fiji
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Funafuti > /tz_data_generated/zdump/Pacific/Funafuti
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Galapagos > /tz_data_generated/zdump/Pacific/Galapagos
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Gambier > /tz_data_generated/zdump/Pacific/Gambier
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Guadalcanal > /tz_data_generated/zdump/Pacific/Guadalcanal
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Guam > /tz_data_generated/zdump/Pacific/Guam
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Honolulu > /tz_data_generated/zdump/Pacific/Honolulu
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Kiritimati > /tz_data_generated/zdump/Pacific/Kiritimati
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Kosrae > /tz_data_generated/zdump/Pacific/Kosrae
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Kwajalein > /tz_data_generated/zdump/Pacific/Kwajalein
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Majuro > /tz_data_generated/zdump/Pacific/Majuro
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Marquesas > /tz_data_generated/zdump/Pacific/Marquesas
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Midway > /tz_data_generated/zdump/Pacific/Midway
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Nauru > /tz_data_generated/zdump/Pacific/Nauru
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Niue > /tz_data_generated/zdump/Pacific/Niue
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Norfolk > /tz_data_generated/zdump/Pacific/Norfolk
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Noumea > /tz_data_generated/zdump/Pacific/Noumea
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Pago_Pago > /tz_data_generated/zdump/Pacific/Pago_Pago
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Palau > /tz_data_generated/zdump/Pacific/Palau
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Pitcairn > /tz_data_generated/zdump/Pacific/Pitcairn
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Pohnpei > /tz_data_generated/zdump/Pacific/Pohnpei
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Port_Moresby > /tz_data_generated/zdump/Pacific/Port_Moresby
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Rarotonga > /tz_data_generated/zdump/Pacific/Rarotonga
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Saipan > /tz_data_generated/zdump/Pacific/Saipan
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Tahiti > /tz_data_generated/zdump/Pacific/Tahiti
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Tarawa > /tz_data_generated/zdump/Pacific/Tarawa
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Tongatapu > /tz_data_generated/zdump/Pacific/Tongatapu
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Wake > /tz_data_generated/zdump/Pacific/Wake
RUN mkdir -p /tz_data_generated/zdump/Pacific
RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/Pacific/Wallis > /tz_data_generated/zdump/Pacific/Wallis


# Archive the data
RUN tar -czvf /tz_data.tar.gz /tz_data_generated

# Command to copy the data archive
CMD ["cp", "/tz_data.tar.gz", "/output/tz_data.tar.gz"]
cd ..
make build
cd release
mkdir dna
cp ../syn.dna dna
cd ../ui/
npm run build
cd ../release/ui
rm -rf build
cp -r ../../ui/public/build/ build/
cd ..
npm i

if [ "$(uname)" == "Darwin" ]; then
  npm run package-mac
else
  npm run package-linux
fi

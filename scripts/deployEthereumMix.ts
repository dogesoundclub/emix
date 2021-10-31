import hardhat from "hardhat";

async function main() {
    console.log("deploy start")

    const EthereumMix = await hardhat.ethers.getContractFactory("EthereumMix")
    const emix = await EthereumMix.deploy("0x5307B5E725feB3D6A55605daC1986e3571FB765D")
    console.log(`EthereumMix address: ${emix.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
